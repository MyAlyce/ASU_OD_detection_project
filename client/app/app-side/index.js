import { BaseSideService, settingsLib } from '@zeppos/zml/base-side';

AppSideService(
	BaseSideService({
		onInit() {
			console.log('app side service invoke onInit');

			// Set up a timer to check for permission sync requests from the device app
			setInterval(() => {
				try {
					// Check if there's a sync request in the global storage
					const syncRequest = this.request({
						method: 'GET_SYNC_REQUEST'
					});

					if (syncRequest && syncRequest.permissions) {
						console.log('DEBUG: Found sync request in global storage');

						// Update settings storage with the permissions
						Object.keys(syncRequest.permissions).forEach(key => {
							const value = syncRequest.permissions[key];
							settingsLib.setItem(`toggle_${key}`, JSON.stringify(value));
						});

						// Clear the sync request
						this.call({
							method: 'CLEAR_SYNC_REQUEST'
						});
					}
				} catch (error) {
					console.error('Error checking for sync requests:', error);
				}
			}, 5000); // Check every 5 seconds
		},

		onRun() {},

		onDestroy() {},

		onRequest(req, res) {
			console.log(`Method ==> ${req.method}`);
			if (req.method === 'GET_TOKEN') {
				const googleAuthData = settingsLib.getItem('googleAuthData');
				if (!googleAuthData) {
					res('No token found');
					return;
				}
				const parsedAuthData = JSON.parse(googleAuthData);
				res(null, {
					accessToken: parsedAuthData.access_token,
					refreshToken: parsedAuthData.refresh_token,
					expiresAt: parsedAuthData.expires_at,
				});
			} else if (req.method === 'SYNC_PERMISSIONS') {
				// Handle permission sync request from settings or device app
				console.log('DEBUG: SYNC_PERMISSIONS request received in app-side service');
				try {
					const permissions = req.params.permissions;
					console.log('DEBUG: Permissions received:', JSON.stringify(permissions));

					if (permissions) {
						// Update settings storage with the permissions (skip the timestamp key)
						Object.keys(permissions).forEach(key => {
							// Skip the timestamp key as it's not a real permission
							if (key !== 'timestamp') {
								const value = permissions[key];
								settingsLib.setItem(`toggle_${key}`, JSON.stringify(value));
								console.log(`DEBUG: Updated settings storage: toggle_${key} = ${value}`);
							}
						});

						// Add timestamp if not present
						if (!permissions.timestamp) {
							permissions.timestamp = new Date().getTime();
						}

						// Also update the permissions_sync key to trigger the settings UI update
						settingsLib.setItem('permissions_sync', JSON.stringify({
							permissions: permissions,
							timestamp: permissions.timestamp,
							source: 'device'
						}));
						console.log('DEBUG: Updated permissions_sync in settings storage');

						// Forward the permissions to the device app (in case this was called from settings)
						console.log('DEBUG: Forwarding permissions to device app');
						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions }
						});

						res(null, { success: true });
						console.log('DEBUG: SYNC_PERMISSIONS completed successfully');
					} else {
						console.log('DEBUG: No permissions provided in request');
						res('No permissions provided');
					}
				} catch (error) {
					console.error('Error syncing permissions:', error);
					res(`Error: ${error.message}`);
				}
			} else if (req.method === 'GET_SETTINGS_PERMISSIONS') {
				// Get all permission-related settings
				try {
					const allSettings = settingsLib.getAll();
					const permissionSettings = {};

					// Extract all toggle_ prefixed settings
					Object.keys(allSettings).forEach(key => {
						if (key.startsWith('toggle_')) {
							const permKey = key.replace('toggle_', '');
							try {
								permissionSettings[permKey] = JSON.parse(allSettings[key]);
							} catch (e) {
								// If parsing fails, use the raw value
								permissionSettings[permKey] = allSettings[key] === 'true';
							}
						}
					});

					res(null, { permissions: permissionSettings });
				} catch (error) {
					console.error('Error getting settings permissions:', error);
					res(`Error: ${error.message}`);
				}
			}
		},

		onCall(req) {
			console.log(`Method ==> ${req.method}`);
			if (req.method === 'SET_TOKEN_SETTINGS') {
				settingsLib.setItem(
					'googleAuthData',
					JSON.stringify({
						access_token: req.params.accessToken,
						refresh_token: req.params.refreshToken,
						expires_at: req.params.expiresAt,
					}),
				);
			} else if (req.method === 'SYNC_SETTINGS_PERMISSIONS') {
				// Handle permission sync from settings to device
				try {
					const permissions = req.params.permissions;
					if (permissions) {
						// Send the permissions to the device app
						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions }
						});
						console.log('Sent permissions to device app');
					}
				} catch (error) {
					console.error('Error syncing settings permissions to device:', error);
				}
			}
		},

		onSettingsChange({ key, newValue, oldValue }) {
			console.log('onSettingsChange', key, newValue, oldValue);
			console.log(settingsLib.getAll());

			if (key === 'googleAuthData' && newValue) {
				const parsedValue = JSON.parse(newValue);
				console.log('googleAuthData changed');
				this.call({
					method: 'SET_TOKEN',
					params: {
						key: 'googleAuthData',
						accessToken: parsedValue.access_token,
						refreshToken: parsedValue.refresh_token,
						expiresAt: parsedValue.expires_at,
					},
				});
			} else if (key === 'permissions_sync' && newValue) {
				// Handle permissions sync request from settings
				try {
					console.log('DEBUG: permissions_sync changed, value:', newValue);
					const syncData = JSON.parse(newValue);
					if (syncData && syncData.permissions) {
						const permissions = syncData.permissions;
						console.log('DEBUG: Permissions sync requested from settings:', JSON.stringify(permissions));

						// Send the permissions to the device app
						console.log('DEBUG: About to call UPDATE_PERMISSIONS on device app');
						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions }
						});
						console.log('DEBUG: UPDATE_PERMISSIONS call completed');
					}
				} catch (error) {
					console.error('Error handling permissions sync:', error);
				}
			} else if (key.startsWith('toggle_')) {
				// Handle permission toggle changes in settings
				try {
					// Extract the permission key without the toggle_ prefix
					const permKey = key.replace('toggle_', '');
					const permValue = newValue ? JSON.parse(newValue) : false;

					console.log(`Permission changed in settings: ${permKey} = ${permValue}`);

					// Get all current permission settings
					const allSettings = settingsLib.getAll();
					const permissionSettings = {};

					// Extract all toggle_ prefixed settings
					Object.keys(allSettings).forEach(k => {
						if (k.startsWith('toggle_')) {
							const pKey = k.replace('toggle_', '');
							try {
								permissionSettings[pKey] = JSON.parse(allSettings[k]);
							} catch (e) {
								// If parsing fails, use the raw value
								permissionSettings[pKey] = allSettings[k] === 'true';
							}
						}
					});

					// Send the updated permissions to the device app
					this.call({
						method: 'UPDATE_PERMISSIONS',
						params: { permissions: permissionSettings }
					});
				} catch (error) {
					console.error('Error handling permission change:', error);
				}
			}
		},
	}),
);
