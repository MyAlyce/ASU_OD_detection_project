import * as notificationMgr from "@zos/notification";
import { Time } from '@zos/sensor';
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Sleep } from "@zos/sensor";
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import hmUI from "@zos/ui";

const timeSensor = new Time();
const storage = getApp()._options.globalData.storage;

AppService(
    BasePage({
        onInit() {
            this.log('storage exists?', !!storage)
            const token = storage.getKey('token');
            this.log('token', token);
            hmUI.showToast({
                text: "starting with token " + token
            });
            timeSensor.onPerMinute(() => {
                this.log(
                    `Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`
                )
                this.log('token', token)

                this.sendDataToGoogleSheets(token).then(() => {
                    this.log('Successfully wrote to Google Sheets');
                    notificationMgr.notify({
                        title: "Google sheets",
                        content: "sent data successfully"
                    })
                }).catch(error => {
                    this.log('Failed to write to Google Sheets', error);
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
            this.log('app side service onRun');
        },
        onDestroy() {
            this.log('app side service onDestroy');
        },
        sendDataToGoogleSheets(token) {
            if (!token) {
                this.log('No token provided');
                return;
            }

            const data = this.getMetrics();
            const headers = [
                'Record Time',
                'User ID',
                'Device Info',
                'Last Heart Rate',
                'Resting Heart Rate',
                'Daily Heart Rate Summary',
                'Sleep Info',
                'Sleep Stages',
                'Sleep Status'
            ];

            const dataRow = [
                new Date(data.recordTime * 1000).toISOString(),
                JSON.stringify(data.user),
                JSON.stringify(data.device),
                data.heartRateLast,
                data.heartRateResting,
                JSON.stringify(data.heartRateSummary),
                JSON.stringify(data.sleepInfo),
                JSON.stringify(data.sleepStageList),
                JSON.stringify(data.sleepStatus)
            ];

            const formattedData = [headers, dataRow];

            const spreadsheetId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // Replace with actual spreadsheet ID
            const range = 'Sheet1!A1'; // specify cell A1

            const body = {
                range,
                values: formattedData,
                majorDimension: 'ROWS',
            };
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;

            this.httpRequest({
                method: 'PUT',
                url,
                body: JSON.stringify(body),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }).then(response => response.json())
                .then(responseData => {
                    console.log('Response from Google Sheets API:', responseData);
                    return responseData;
                }).catch(error => {
                    console.error('Error from Google Sheets API:', error);
                    throw error;
                });
        }
    })
);
