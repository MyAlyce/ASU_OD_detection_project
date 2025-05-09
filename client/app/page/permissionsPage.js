import hmUI from '@zos/ui';
import { push } from '@zos/router';
import {
	TOGGLE_OPTIONS,
	BACK_BUTTON,
	titleText,
	createToggleLabel,
} from 'zosLoader:./permissionsPage.[pf].layout.js';
import { LocalStorage } from '@zos/storage'; // Import LocalStorage only once

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
		this.restoreToggleStates(); // Restore saved states when the page is initialized
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
	},

	// Function to restore the toggle states from localStorage
	restoreToggleStates() {
		TOGGLE_OPTIONS.forEach((option) => {
			const toggleId = option.key;

			// Retrieve saved state from localStorage
			const storedState = this.localStorage.getItem(toggleId);
			if (storedState !== null) {
				this.state[toggleId] = storedState === 'true'; // Convert string to boolean
			}

			console.log(`Restored ${toggleId} state: ${this.state[toggleId]}`);
		});
	},
});
