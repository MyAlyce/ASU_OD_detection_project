import * as notificationMgr from "@zos/notification";
import { Time } from '@zos/sensor';
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Sleep } from "@zos/sensor";
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import { sendDataToGoogleSheets } from '../app-side/google-api';

const timeSensor = new Time();
const url = 'insert_ngrok_url_here/post'; // replace with your ngrok tunnel url

// create new branch

AppService(
    BasePage({
        onInit() {
            this.log('app service onInit');
            timeSensor.onPerMinute(() => {
                this.log(
                    `Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`
                )

                this.request({
                    method: "POST_TO_GOOGLE",
                    body: this.getMetrics()
                }).then((res) => {
                    this.log('[App Service] POST_TO_GOOGLE ==>', res);
                }).catch((err) => {
                    this.log('POST_TO_GOOGLE errored', err);
                });

                // If we need to instead use side-service:
                // this.request({ method: "GET_TOKEN" }).then((res) => {
                //     const token = res.token;
                //     this.log('[App Service] GET_TOKEN ==>', res);
                //     this.log('[App Service] token ==>', res.token);
                //     this.sendToGoogleSheets(token);
                // }).catch((err) => {
                //     this.log('GET_TOKEN errored', err);
                // });

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
        sendMetricsToServer() {
            this.httpRequest({
                method: 'POST',
                url: url,
                body: JSON.stringify(this.getMetrics()),
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
