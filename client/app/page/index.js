import { BasePage } from '@zeppos/zml/base-page';
import * as appService from '@zos/app-service';
import { queryPermission, requestPermission } from '@zos/app';
import hmUI from '@zos/ui';
import { push } from '@zos/router';
import { Sleep } from '@zos/sensor'; 
import * as notificationMgr from '@zos/notification';

import {
    START_BUTTON,
    SLEEP_BUTTON,
    PERMISSIONS_BUTTON,
    STOP_BUTTON,
    RESUCE_PLAN_BUTTON,
} from 'zosLoader:./index.[pf].layout.js';

import {
    onClickSleepButton,
    getSleepInfo,
    getStageConstantObj,
} from './permFunctions.js';

const permissions = ['device:os.bg_service'];
const service = 'app-service/service';
const storage = getApp().globals.storage;
const sleep = new Sleep();
let jsonstringPermissions = storage.getKey('permissions') || '{}'; // Retrieve stored permissions if available

// Main page setup
Page(
    BasePage({
        state: {
            temp: null,
            permissions: JSON.parse(jsonstringPermissions), // Load permissions from storage or fallback to an empty object
        },

        onInit(params) {
            console.log('Index Page onInit invoked');
            console.log('Received params:', params);

            // Ensure params is a string and parse it
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
            if (params && typeof params === 'object' && Object.keys(params).length > 1) {
                const permissionKeys = [
                    'sleepScore',
                    'startEndTime',
                    'deepSleepTime',
                    'totalSleepTime',
                    'wakeStage',
                    'remStage',
                    'lightStage',
                    'deepStage',
                    'heartRate',
                ];

                let permissions = {}; // Local object to store permissions

                permissionKeys.forEach((key) => {
                    if (params.hasOwnProperty(key)) {
                        permissions[key] = params[key];
                        console.log(`Permission: ${key}, Value: ${params[key]}`);
                    }
                });

                this.state.permissions = permissions;
                // Update the global jsonstringPermissions when permissions are set
                jsonstringPermissions = JSON.stringify(permissions);
                storage.setKey('permissions', jsonstringPermissions); // Store the updated permissions in storage
                console.log('Updated global jsonstringPermissions:', jsonstringPermissions);
            } else {
                console.log('No permission data received or invalid format.');
            }

            this.request({
                method: 'GET_TOKEN',
            })
                .then((res) => {
                    hmUI.showToast({
                        text: `token: ${res.accessToken} expires at ${res.expiresAt}`,
                    });
                    storage.setKey('token', res.accessToken);
                    storage.setKey('refreshToken', res.refreshToken);
                    storage.setKey('expiresAt', res.expiresAt);
                })
                .catch((err) => {
                    hmUI.showToast({
                        text: 'Error getting token on load (not signed in?)',
                    });
                    console.error('Error getting token', err);
                });
        },

        build() {
            // Start Button
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

                    if (checkPermissions()) {
                        startAppService(token);
                    } else {
                        console.log('Permission denied');
                    }
                },
            });

            // Stop Button
            hmUI.createWidget(hmUI.widget.BUTTON, {
                ...STOP_BUTTON,
                click_func: () => {
                    console.log('stop button clicked');
                    appService.stop({
                        file: service,
                        complete_func: (info) => {
                            console.log('service stopped complete_func:', JSON.stringify(info));
                            hmUI.showToast({
                                text: info.result ? 'Service stopped' : 'Service failed to stop',
                            });
                        },
                    });
                },
            });

            // Sleep Button
            hmUI.createWidget(hmUI.widget.BUTTON, {
                ...SLEEP_BUTTON,
                click_func: () => {
                    // Use the global jsonstringPermissions directly
                    console.log('Global JSON string of permissions:', jsonstringPermissions);
                    onClickSleepButton(jsonstringPermissions);
                },
            });

            // Permissions Button
            hmUI.createWidget(hmUI.widget.BUTTON, {
                ...PERMISSIONS_BUTTON,
                click_func: () => {
                    console.log('Permissions button clicked');
                    push({
                        url: 'page/permissionsPage',
                    });
                },
            });

            // Rescue Plan Button
            hmUI.createWidget(hmUI.widget.BUTTON, {
                ...RESUCE_PLAN_BUTTON,
                click_func: () => {
                    console.log('Rescue Plan button clicked');

                    // Now using the global jsonstringPermissions
                    console.log('Global JSON string of permissions:', jsonstringPermissions);

                    try {
                        // Parse the JSON string to access the permissions as an object
                        const permissions = JSON.parse(jsonstringPermissions);

                        // Log the parsed permissions object
                        console.log('Parsed permissions:', permissions);

                        // Check the heart rate permission
                        if (permissions) {                        
                            console.log('Made it passed If Permissions bit');

                            Object.entries(permissions).forEach(([key, value]) => {
                                console.log('The key is: ', key);

                                if (key === 'heartRate') {
                                    console.log(`Current heart rate permission: ${value}`);
                                     
                                    if (value === true) {
                                        console.log('Heart rate permission is granted.');
                                        push({
                                            url: 'page/rescuePlan',
                                            params: jsonstringPermissions,  // Pass the updated permissions
                                        });
                                    } else {
                                        console.log('Heart rate permission not granted.');
                                        notificationMgr.notify({
                                            title: "Permission Required",
                                            content: "You need to enable heart permissions to continue. Do you wish to enable it?",
                                            actions: [
                                                {
                                                    text: "Yes",
                                                    file: "page/permissionsPage", // Navigate to permissions page
                                                },
                                                {
                                                    text: "No",
                                                    file: "page/index", // Go back to index page
                                                },
                                            ],
                                            vibrate: 6, // Custom vibration for alert
                                        });
                                    }
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing global permissions:', error);
                    }
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
                storage.setKey('expiresAt', req.params.expiresAt);
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
                    ? 'Service started: ' + token
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
