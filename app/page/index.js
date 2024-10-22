import { BasePage } from '@zeppos/zml/base-page';
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission } from "@zos/app";
import hmUI from '@zos/ui';
import { START_BUTTON } from 'zosLoader:./index.[pf].layout.js';
import { SLEEP_BUTTON } from 'zosLoader:./index.[pf].layout.js';
import { Sleep } from '@zos/sensor';

const permissions = ["device:os.bg_service"];
const service = "app-service/service";

// Variable to store the last sleep info
let lastSleepInfo = null;

Page(
  BasePage({
    state: {},
    build() {
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...START_BUTTON,
        click_func: () => {
          console.log('fetch button clicked'); // Log when button is clicked
          if (checkPermissions()) {
            console.log('Permissions check passed, starting app service');
            startAppService();
          } else {
            console.log('permission denied');
          }
        }
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...SLEEP_BUTTON,
        click_func: () => {
          console.log('Sleep button clicked');
          startSleepMonitoring(); // Fetch sleep data directly without permissions
        }
      });
    },

    onInit() {
      console.log('page onInit invoked');
    },

    onDestroy() {
      console.log('page onDestroy invoked');
    },
  }),
);

// Function to start the app service
const startAppService = () => {
  console.log('startAppService invoked');
  console.log(`starting service: ${service}`);
  appService.start({
    url: service,
    complete_func: (info) => {
      console.log('service started complete_func:', JSON.stringify(info));
      hmUI.showToast({
        text: `service started: ${JSON.stringify(info)}`
      });
    }
  })
}

const checkPermissions = () => {
  const [permissionResult] = queryPermission({
    permissions
  });
  if (permissionResult === 2) {
    console.log('permission previously allowed');
    return true;
  } else {
    requestPermission({
      permissions,
      callback([result]) {
        if (result === 2) {
          console.log('permission granted');
          return true;
        }
      }
    });
  }
  return false;
}

// Function for starting sleep monitoring
const startSleepMonitoring = () => {
  console.log('startSleepMonitoring invoked');
  const sleepSensor = new Sleep();

  // Fetch the latest sleep data
  sleepSensor.updateInfo(); // Update sleep data
  const currentSleepInfo = sleepSensor.getInfo();

  // Check if the sleep data is valid
  if (currentSleepInfo) {
    // Only display if the sleep data has changed
    if (JSON.stringify(currentSleepInfo) !== JSON.stringify(lastSleepInfo)) {
      lastSleepInfo = currentSleepInfo; // Update last sleep info
      displaySleepInfo(currentSleepInfo);
    }
  } else {
    console.log("Unable to retrieve sleep data.");
    hmUI.showToast({
      text: "Unable to retrieve sleep data.",
    });
  }
};

// Function to display only the total sleep time
const displaySleepInfo = (sleepInfo) => {
  const totalSleepTime = sleepInfo.total_sleep_time; // Extract total sleep time

  // Display total sleep time in the console
  console.log(`Displayed Total Sleep Time: ${totalSleepTime} minutes`);

  // Show a toast message with just the total sleep time for 15 seconds (15000 milliseconds)
  hmUI.showToast({
    text: `Total Sleep Time: ${totalSleepTime} minutes`,
  });
};
