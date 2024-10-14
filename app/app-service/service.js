import * as notificationMgr from "@zos/notification";
import { Time } from '@zos/sensor';
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Sleep } from "@zos/sensor";
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import { settingsLib } from "@zeppos/zml/base-side";

const timeSensor = new Time();
const url = 'https://0232-24-251-182-244.ngrok-free.app/post'; // replace with your ngrok tunnel url

AppService(
    BasePage({
        onInit() {
            console.log('app service onInit');
            console.log('The settings have');


            timeSensor.onPerMinute(() => {
                this.log("app service running");
                // this.sendMetrics();
                this.request({ method: "GET_TOKEN" }).then((res) => {
                    console.log('[App Service] GET_TOKEN ==>', JSON.stringify(res));
                }).catch((err) => {
                    console.log('GET_TOKEN errored', err);
                });

                console.log(
                    `Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`
                )
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
