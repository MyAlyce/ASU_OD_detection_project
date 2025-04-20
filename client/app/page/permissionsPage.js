import hmUI from '@zos/ui';
import { push } from '@zos/router';
import {
	TOGGLE_OPTIONS,
	BACK_BUTTON,
	titleText,
	createToggleLabel,
} from 'zosLoader:./permissionsPage.[pf].layout.js';
import { LocalStorage } from '@zos/storage';
import { px } from '@zos/utils';

console.log('Navigated to the permissions page');

Page({
	state: {
		message: 'Permissions Page',
		sleepScore: true,
		startEndTime: true,
		deepSleepTime: true,
		totalSleepTime: true,
		wakeStage: true,
		remStage: true,
		lightStage: true,
		deepStage: true,
		heartRate: true,
	},

	onInit() {
		console.log('Permissions Page onInit invoked');
		this.localStorage = new LocalStorage(); // Initialize LocalStorage once
		this.globalStorage = getApp().globals.storage; // Get global storage for app-wide state

		// Check if we're coming back to this page and need to sync with settings
		const lastVisitTime = this.localStorage.getItem('lastPermissionsVisit');
		const currentTime = new Date().getTime();
		this.localStorage.setItem('lastPermissionsVisit', currentTime.toString());

		// If we have a last visit time and it was more than 2 seconds ago,
		// we might have changes from settings that need to be synced
		if (lastVisitTime && (currentTime - parseInt(lastVisitTime)) > 2000) {
			console.log('DEBUG: Returning to permissions page, checking for updates from settings');

			// First check global storage for the latest permissions
			const globalPermissions = this.globalStorage.getKey('permissions');
			if (globalPermissions) {
				try {
					const parsedPermissions = JSON.parse(globalPermissions);
					const lastUpdateTime = this.localStorage.getItem('lastPermissionsUpdate');

					// If the global permissions were updated after our last visit, use them
					if (!lastUpdateTime || parsedPermissions.timestamp > parseInt(lastUpdateTime)) {
						console.log('DEBUG: Found newer permissions in global storage, updating state');

						// Update our state with the global permissions
						Object.keys(parsedPermissions).forEach(key => {
							if (this.state.hasOwnProperty(key) && key !== 'timestamp') {
								this.state[key] = parsedPermissions[key];
							}
						});

						// Update localStorage with the new state
						Object.keys(this.state).forEach(key => {
							this.localStorage.setItem(key, this.state[key].toString());
						});
						this.localStorage.setItem('userPermissions', JSON.stringify(this.state));

						// Update the last update time
						this.localStorage.setItem('lastPermissionsUpdate', currentTime.toString());

						console.log('DEBUG: State updated from global storage');
						hmUI.showToast({
							text: 'Permissions synced from settings',
						});

						// Skip the normal restore since we've already updated the state
						return;
					}
				} catch (error) {
					console.error('DEBUG: Error parsing global permissions:', error);
				}
			}
		}

		// If we didn't find newer permissions in global storage, restore from localStorage as usual
		this.restoreToggleStates();
	},

	build() {
		console.log('Permissions Page Build Called');

		// Display the main title
		// Need to add to permissionsPage layout file
		hmUI.createWidget(hmUI.widget.TEXT, {
			...titleText,
		});

		// Create toggle switches with their corresponding names
		TOGGLE_OPTIONS.forEach((option, index) => {
			const checkedValue =
				this.state[option.key] !== undefined ? this.state[option.key] : true;

			// Create the switch widget for each option
			hmUI.createWidget(hmUI.widget.SLIDE_SWITCH, {
				x: option.x + 100, // Position the toggle switch slightly to the right
				y: option.y,
				w: option.w,
				h: option.h,
				checked: checkedValue,
				color: 0xffffff, // Text color for better visibility
				text_size: px(16), // Smaller text size
				checked_change_func: (slideSwitch, checked) => {
					// Handle toggle change
					this.handleToggleChange(option.key, checked); // Call the function for toggle change
				},
			});

			// Create the label for each toggle switch next to it
			hmUI.createWidget(hmUI.widget.TEXT, {
				...createToggleLabel(option),
			});

			console.log(`Created toggle widget and label for: ${option.label}`);
		});

		// Add the back button at the bottom of the page
		hmUI.createWidget(hmUI.widget.BUTTON, {
			...BACK_BUTTON,
			click_func: () => {
				console.log('Back button clicked, preferences saved:');

				// Log all the permissions and their state
				TOGGLE_OPTIONS.forEach((option) => {
					const permissionState = this.state[option.key];
					console.log(`${option.label}: ${permissionState}`);
				});

				// Save permissions to localStorage
				this.localStorage.setItem(
					'userPermissions',
					JSON.stringify(this.state),
				); // Store the entire state

				// Log the params being passed to index.js
				const paramsToPass = JSON.stringify(this.state);
				console.log(
					'Passing the following parameters to index.js: ',
					paramsToPass,
				);

				// Pass the entire state through params when navigating to index.js
				push({
					url: 'page/index',
					params: paramsToPass, // Pass the state as params
				});
			},
		});
	},

	onDestroy() {
		console.log('Permissions Page onDestroy invoked');
	},

	// Function to handle toggle change and save the state to localStorage
	handleToggleChange(toggleId, isChecked) {
		// Update the state when the switch is toggled
		this.state[toggleId] = isChecked;
		console.log(`${toggleId} tracking set to ${isChecked}`);

		// Store updated state to localStorage
		this.localStorage.setItem(toggleId, isChecked.toString()); // Store state as a string

		// Update the last update time
		const currentTime = new Date().getTime();
		this.localStorage.setItem('lastPermissionsUpdate', currentTime.toString());

		// Sync with settings storage
		try {
			// Update the global storage for app-wide access with timestamp
			if (this.globalStorage) {
				const permissionsWithTimestamp = { ...this.state, timestamp: currentTime };
				this.globalStorage.setKey('permissions', JSON.stringify(permissionsWithTimestamp));
			}

			// Send the updated permissions to the app-side service to update settings
			try {
				// Get the app-side service from the global data
				const appSideService = getApp()._options.globalData.appSideService;
				if (appSideService) {
					console.log('DEBUG: Sending permission update to app-side service');
					appSideService.call({
						method: 'SYNC_PERMISSIONS',
						params: { permissions: { ...this.state, timestamp: currentTime } }
					});
					console.log(`DEBUG: Sent ${toggleId} update to app-side service: ${isChecked}`);
				} else {
					console.log('DEBUG: No app-side service available, using alternative method');
					// Alternative method: Set a special key in global storage
					this.globalStorage.setKey('permissions_sync_request', JSON.stringify({
						permissions: { ...this.state, timestamp: currentTime },
						timestamp: currentTime
					}));
				}
			} catch (syncError) {
				console.error('DEBUG: Error sending to app-side service:', syncError);
			}

			console.log(`Synced ${toggleId} with settings storage: ${isChecked}`);
		} catch (error) {
			console.error('Error syncing with settings storage:', error);
		}
	},

	// Function to restore the toggle states from localStorage
	restoreToggleStates() {
		// First check if we have permissions in global storage
		if (this.globalStorage) {
			const globalPermissions = this.globalStorage.getKey('permissions');
			if (globalPermissions) {
				try {
					const parsedPermissions = JSON.parse(globalPermissions);
					// Update state with global permissions
					Object.keys(parsedPermissions).forEach(key => {
						if (this.state.hasOwnProperty(key)) {
							this.state[key] = parsedPermissions[key];
						}
					});
					console.log('Restored permissions from global storage');
					return; // Skip the localStorage check if we successfully loaded from global storage
				} catch (error) {
					console.error('Error parsing global permissions:', error);
				}
			}
		}

		// Fall back to localStorage if global storage doesn't have permissions
		TOGGLE_OPTIONS.forEach((option) => {
			const toggleId = option.key;

			// Retrieve saved state from localStorage
			const storedState = this.localStorage.getItem(toggleId);
			if (storedState !== null) {
				this.state[toggleId] = storedState === 'true'; // Convert string to boolean
			}

			console.log(`Restored ${toggleId} state: ${this.state[toggleId]}`);
		});

		// Save to global storage for future use
		if (this.globalStorage) {
			this.globalStorage.setKey('permissions', JSON.stringify(this.state));
		}
	},
});
