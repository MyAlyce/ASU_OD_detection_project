import * as notificationMgr from "@zos/notification";
import { Time } from '@zos/sensor';
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Sleep } from "@zos/sensor";
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';

const timeSensor = new Time();
const url = 'insert_ngrok_url_here/post'; // replace with your ngrok tunnel url

AppService(
    BasePage({
        onInit() {
            this.log('app service onInit');

            timeSensor.onPerMinute(() => {
                this.log("app service running");
                this.sendMetrics(); 
            });
        },
        sendMetrics() {
            const startTime = new Date().getTime();
            const deviceInfo = getDeviceInfo();
            const heartRate = new HeartRate();
            const sleep = new Sleep();

            sleep.updateInfo();

            const reqBody = {
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

            this.httpRequest({
                method: 'POST',
                url: url,
                body: JSON.stringify(reqBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(result => {
                return result.json();
            }).then(data => {
                this.log(data);
            }).catch(error => {
                this.log(error);
            });
        },
        onRun() {
            this.log('app side service onRun');
        },
        onDestroy() {
            this.log('app side service onDestroy');
        },
    })
);
