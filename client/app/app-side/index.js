import { BaseSideService, settingsLib } from '@zeppos/zml/base-side';

AppSideService(
	BaseSideService({
		onInit() {
			console.log('app side service invoke onInit');

			// Set up a timer to check for permission sync requests from the device app
			setInterval(() => {
				try {
					const syncRequest = this.request({
						method: 'GET_SYNC_REQUEST',
					});

					if (syncRequest && syncRequest.permissions) {
						console.log('DEBUG: Found sync request in global storage');

						Object.keys(syncRequest.permissions).forEach((key) => {
							const value = syncRequest.permissions[key];
							settingsLib.setItem(`toggle_${key}`, JSON.stringify(value));
						});

						this.call({
							method: 'CLEAR_SYNC_REQUEST',
						});
					}
				} catch (error) {
					console.error('Error checking for sync requests:', error);
				}
			}, 5000);
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
			} else if (req.method === 'GET_FOLDER_ID') {
				const folderId = settingsLib.getItem('zeppGoogleFolderId');
				if (!folderId) {
					res('No folder ID found');
					return;
				}
				res(null, { folderId });
			} else if (req.method === 'SYNC_PERMISSIONS') {
				console.log('DEBUG: SYNC_PERMISSIONS request received');
				try {
					const permissions = req.params.permissions;

					if (permissions) {
						Object.keys(permissions).forEach((key) => {
							if (key !== 'timestamp') {
								const value = permissions[key];
								settingsLib.setItem(`toggle_${key}`, JSON.stringify(value));
							}
						});

						if (!permissions.timestamp) {
							permissions.timestamp = new Date().getTime();
						}

						settingsLib.setItem(
							'permissions_sync',
							JSON.stringify({
								permissions,
								timestamp: permissions.timestamp,
								source: 'device',
							}),
						);

						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions },
						});

						res(null, { success: true });
					} else {
						res('No permissions provided');
					}
				} catch (error) {
					console.error('Error syncing permissions:', error);
					res(`Error: ${error.message}`);
				}
			} else if (req.method === 'GET_SETTINGS_PERMISSIONS') {
				try {
					const allSettings = settingsLib.getAll();
					const permissionSettings = {};

					Object.keys(allSettings).forEach((key) => {
						if (key.startsWith('toggle_')) {
							const permKey = key.replace('toggle_', '');
							try {
								permissionSettings[permKey] = JSON.parse(allSettings[key]);
							} catch {
								permissionSettings[permKey] = allSettings[key] === 'true';
							}
						}
					});

					res(null, { permissions: permissionSettings });
				} catch (error) {
					console.error('Error getting permissions:', error);
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
			} else if (req.method === 'UPDATE_FOLDER_ID') {
				settingsLib.setItem('zeppGoogleFolderId', req.params.folderId);
			} else if (req.method === 'SYNC_SETTINGS_PERMISSIONS') {
				try {
					const permissions = req.params.permissions;
					if (permissions) {
						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions },
						});
					}
				} catch (error) {
					console.error('Error syncing permissions to device:', error);
				}
			}
		},

		onSettingsChange({ key, newValue, oldValue }) {
			console.log('onSettingsChange', key, newValue, oldValue);
			console.log(settingsLib.getAll());

			if (key === 'googleAuthData' && newValue) {
				const parsedValue = JSON.parse(newValue);
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
				try {
					const syncData = JSON.parse(newValue);
					if (syncData && syncData.permissions) {
						this.call({
							method: 'UPDATE_PERMISSIONS',
							params: { permissions: syncData.permissions },
						});
					}
				} catch (error) {
					console.error('Error handling permission sync:', error);
				}
			} else if (key.startsWith('toggle_')) {
				try {
					const permKey = key.replace('toggle_', '');
					const permValue = newValue ? JSON.parse(newValue) : false;

					console.log(`Permission changed: ${permKey} = ${permValue}`);

					const allSettings = settingsLib.getAll();
					const permissionSettings = {};

					Object.keys(allSettings).forEach((k) => {
						if (k.startsWith('toggle_')) {
							const shortKey = k.replace('toggle_', '');
							try {
								permissionSettings[shortKey] = JSON.parse(allSettings[k]);
							} catch {
								permissionSettings[shortKey] = allSettings[k] === 'true';
							}
						}
					});

					this.call({
						method: 'UPDATE_PERMISSIONS',
						params: { permissions: permissionSettings },
					});
				} catch (error) {
					console.error('Error updating device permissions:', error);
				}
			}
		},
	}),
);
