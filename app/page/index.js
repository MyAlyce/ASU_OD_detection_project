import { BasePage } from '@zeppos/zml/base-page';
import * as appService from '@zos/app-service';
import { queryPermission, requestPermission } from '@zos/app';
import hmUI from '@zos/ui';
import { push } from '@zos/router';
import { Sleep } from '@zos/sensor'; // Import the Sleep module
import {
	START_BUTTON,
	SLEEP_BUTTON,
	PERMISSIONS_BUTTON,
	STOP_BUTTON,
} from 'zosLoader:./index.[pf].layout.js';

const permissions = ['device:os.bg_service'];
const service = 'app-service/service';
const storage = getApp().globals.storage;
const sleep = new Sleep();

// Main page setup
Page(
	BasePage({
		state: {
			temp: null,
			permissions: {},
		},
		onInit(params) {
			console.log('Index Page onInit invoked');

			// Log the entire params object to see the received data
			console.log('Received params:', params);

			// Check if params is a string and parse it as JSON
			if (typeof params === 'string') {
				try {
					params = JSON.parse(params); // Convert string to object
					console.log('Parsed params:', params);
				} catch (error) {
					console.error('Error parsing params:', error);
					return;
				}
			}

			// Ensure params is an object with keys
			if (
				params &&
				typeof params === 'object' &&
				Object.keys(params).length > 1
			) {
				// Iterate through specific keys and store their values in state
				const permissionKeys = [
					'sleepScore',
					'startEndTime',
					'deepSleepTime',
					'totalSleepTime',
					'wakeStage',
					'remStage',
					'lightStage',
					'deepStage',
				];

				let permissions = {}; // Local object to store permissions

				permissionKeys.forEach((key) => {
					if (params.hasOwnProperty(key)) {
						permissions[key] = params[key];
						console.log(`Permission: ${key}, Value: ${params[key]}`);
					}
				});

				this.state.permissions = permissions;
				console.log('Stored permissions:', this.state.permissions);
			} else {
				console.log('No permission data received or invalid format.');
			}

			this.request({
				method: 'GET_TOKEN',
			})
				.then((res) => {
					hmUI.showToast({
						text: 'token: ' + res.accessToken,
					});
					storage.setKey('token', res.accessToken);
					storage.setKey('refreshToken', res.refreshToken);
					storage.setKey('expiresIn', res.expiresAt);
				})
				.catch((err) => {
					hmUI.showToast({
						text: 'Error getting token on load (not signed in?)',
					});
					console.error('error getting token', err);
				});
		},

		build() {
			hmUI.createWidget(hmUI.widget.BUTTON, {
				...START_BUTTON,
				click_func: () => {
					console.log('fetch button clicked');
					const token = storage.getKey('token');
					if (!token) {
						hmUI.showToast({
							text: 'Please sign in',
						});
						console.log('No token found, user needs to sign in');
						return;
					}

					// Only proceed if got token
					if (checkPermissions()) {
						startAppService(token);
					} else {
						console.log('Permission denied');
					}
				},
			});

			hmUI.createWidget(hmUI.widget.BUTTON, {
				...STOP_BUTTON,
				click_func: () => {
					console.log('stop button clicked');
					appService.stop({
						file: service,
						complete_func: (info) => {
							console.log(
								'service stopped complete_func:',
								JSON.stringify(info),
							);
							hmUI.showToast({
								text: info.result
									? 'Service stopped'
									: 'Service failed to stop',
							});
						},
					});
				},
			});

			hmUI.createWidget(hmUI.widget.BUTTON, {
				...SLEEP_BUTTON,
				click_func: this.onClickSleepButton.bind(this),
			});

			hmUI.createWidget(hmUI.widget.BUTTON, {
				...PERMISSIONS_BUTTON,
				click_func: () => {
					console.log('Permissions button clicked');
					push({
						url: 'page/permissionsPage', // No parameters passed here
					});
				},
			});
		},

		onDestroy() {
			console.log('page onDestroy invoked');
		},

		onRequest(req, res) {
			console.log('page onRequest invoked');
			console.log('req:', req);
			console.log('res:', res);
		},

		onCall(req) {
			if (req.method === 'SET_TOKEN') {
				console.log('SET_TOKEN method invoked');
				hmUI.showToast({
					text: 'Token saved ' + JSON.stringify(req.params),
				});
				storage.setKey('token', req.params.accessToken);
				storage.setKey('refreshToken', req.params.refreshToken);
				storage.setKey('expiresIn', req.params.expiresIn);
			}
		},

		onClickSleepButton() {
			console.log('Sleep button pressed');

			// Log the current state and permissions to see what data is available
			console.log('Current state:', JSON.stringify(this.state));

			// Access permissions from the state
			if (this.state.permissions) {
				Object.entries(this.state.permissions).forEach(([key, value]) => {
					if (value === true) {
						console.log(`Permission for ${key} is granted.`);

						// Actual data extraction based on the granted permission
						switch (key) {
							case 'sleepScore':
								// Get the sleep score using the `getInfo` method
								this.getSleepInfo('score');
								break;
							case 'startEndTime':
								// Get the start and end times (assuming `getInfo` provides this)
								this.getSleepInfo('startTime');
								this.getSleepInfo('endTime');
								break;
							case 'deepSleepTime':
								// Get the deep sleep time using `getInfo`
								this.getSleepInfo('deepTime');
								break;
							case 'totalSleepTime':
								// Get the total sleep time using `getInfo`
								this.getSleepInfo('totalTime');
								break;
							case 'wakeStage':
								// Get the wake stage using `getStageConstantObj`
								this.getStageConstantObj('WAKE_STAGE');
								break;
							case 'remStage':
								// Get the REM stage using `getStageConstantObj`
								this.getStageConstantObj('REM_STAGE');
								break;
							case 'lightStage':
								// Get the light sleep stage using `getStageConstantObj`
								this.getStageConstantObj('LIGHT_STAGE');
								break;
							case 'deepStage':
								// Get the deep sleep stage using `getStageConstantObj`
								this.getStageConstantObj('DEEP_STAGE');
								break;
							default:
								console.log(`No action defined for permission: ${key}`);
						}
					} else {
						console.log(`Permission for ${key} is denied.`);
					}
				});
			} else {
				console.log('No permissions found in state.');
			}
		},

		// Extract sleep info (getInfo method)
		getSleepInfo(infoKey) {
			// Using the ZeppOS Sleep module to fetch the sleep info
			const info = sleep.getInfo();

			if (info && info.hasOwnProperty(infoKey)) {
				console.log(`${infoKey}: ${info[infoKey]}`);
			} else {
				console.log(`No data for ${infoKey}`);
			}
		},

		// Extract stage constant
		getStageConstantObj(stageKey) {
			// Using the ZeppOS Sleep module to fetch stage constants
			const sleepStageConstants = sleep.getStageConstantObj();

			if (sleepStageConstants && sleepStageConstants.hasOwnProperty(stageKey)) {
				console.log(`${stageKey}: ${sleepStageConstants[stageKey]}`);
			} else {
				console.log(`No data for ${stageKey}`);
			}
		},
	}),
);

// Service-related functions
const startAppService = (token) => {
	console.log('startAppService invoked');
	console.log(`starting service: ${service}`);
	appService.start({
		file: service,
		complete_func: (info) => {
			console.log('service started complete_func:', JSON.stringify(info));
			hmUI.showToast({
				text: info.result
					? 'Service started' + token
					: 'Service failed to start',
			});
		},
	});
};

const checkPermissions = () => {
	const [permissionResult] = queryPermission({
		permissions,
	});
	if (permissionResult === 2) {
		console.log('permission previously allowed');
		return true;
	} else {
		requestPermission({
			permissions,
			callback: ([result]) => {
				if (result === 2) {
					console.log('permission granted');
					return true;
				}
			},
		});
	}
	return false;
};
