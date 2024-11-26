import * as notificationMgr from "@zos/notification";
import { Time } from "@zos/sensor";
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Sleep } from "@zos/sensor";
import { getProfile } from "@zos/user";
import { getDeviceInfo } from "@zos/device";
import { sendDataToGoogleSheets } from "./google-api";

const timeSensor = new Time();
const storage = getApp()._options.globalData.storage;
const debug = true;

AppService(
  BasePage({
    onInit() {
      const token = storage.getKey("token");
      this.log("token", token);
      notifyWatch(`Token: ${token}`);
      timeSensor.onPerMinute(() => {
        this.log(
          `Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, "0")}:${timeSensor.getSeconds().toString().padStart(2, "0")}`,
        );

        sendDataToGoogleSheets(this, token, this.getMetrics())
          .then((res) => {
            this.log("Successfully wrote to Google Sheets", res.message);
            notifyWatch(res.message);
          })
          .catch((error) => {
            this.log("Failed to write to Google Sheets", error.message);
            notifyWatch(`Failed to write to Google Sheets: ${error.message}`);
          });
      });
    },
    getMetrics() {
      const deviceInfo = getDeviceInfo();
      const heartRate = new HeartRate();
      const sleep = new Sleep();

      sleep.updateInfo();

      return {
        recordTime: Math.floor(new Date().getTime() / 1000),
        user: getProfile(),
        device: deviceInfo,
        heartRateLast: heartRate.getLast(),
        heartRateResting: heartRate.getResting(),
        heartRateSummary: heartRate.getDailySummary(),
        sleepInfo: sleep.getInfo(),
        sleepStageList: sleep.getStageConstantObj(),
        sleepStatus: sleep.getSleepingStatus(),
      };
    },
    onRun() {
      this.log("app side service onRun");
    },
    onDestroy() {
      this.log("app side service onDestroy");
    },
  }),
);

const notifyWatch = (content) => {
  if (debug) {
    notificationMgr.notify({
      title: "MyAlyce",
      content,
      actions: [],
    });
  }
};
