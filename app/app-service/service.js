import * as notificationMgr from '@zos/notification';
import { Time } from '@zos/sensor';
import { BasePage } from '@zeppos/zml/base-page';
import { HeartRate, Sleep } from '@zos/sensor';
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import { GoogleApi } from './google-api';

const timeSensor = new Time();
const storage = getApp().globals.storage;
const tsdb = getApp().globals.tsdb;
const debug = true;
const SEND_INTERVAL = 1; // in minutes

AppService(
	BasePage({
		onInit() {
			const token = storage.getKey('token');
			const refreshToken = storage.getKey('refreshToken');
			const expiryDate = storage.getKey('expiresAt');
			const googleApi = new GoogleApi(this, token, refreshToken, expiryDate);
			
			notifyWatch(`Starting service, token is here? ${!!token}`);

			// Create a new Google Sheet called "test"
			googleApi.createNewGoogleSheet('test').then((response) => {
				console.log('New spreadsheet created:', response);
				notifyWatch(`Created new Google Sheet: ${response.spreadsheetUrl}`);
			}).catch((error) => {
				console.error('Failed to create new Google Sheet:', error);
				notifyWatch('Failed to create new Google Sheet');
			});


			timeSensor.onPerMinute(() => {
				this.log(
					`Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
				);

				// Every minute, save metrics to TSDB
				// saveToTSDB(this.getMetrics());
				if (timeSensor.getMinutes() % SEND_INTERVAL == 0) {
					const fiveMinutesAgo = Date.now() - 6 * 60 * 1000;
					const now = Date.now();
					notifyWatch(`data ${tsdb.retrieveDataSeries(fiveMinutesAgo, now)}`);

					const data = [this.getMetrics()];

					// todo: connectStatus() to check if the phone is connected
					googleApi
						.sendDataToGoogleSheets(data)
						.then((res) => {
							this.log('Successfully wrote to Google Sheets', res.message);
							notifyWatch(res.message);
							// tsdb.purge(fiveMinutesAgo);
						})
						.catch((error) => {
							this.log('Failed to write to Google Sheets', error.message);
							notifyWatch(
								`Failed to write to Google Sheets: ${JSON.stringify(error.message)}`,
							);
							// TODO save to tsdb for retry later
						});
				}
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
	}),
);

const notifyWatch = (content) => {
	if (debug) {
		notificationMgr.notify({
			title: 'MyAlyce',
			content,
			actions: [],
		});
	}
};

const saveToTSDB = (data) => {
	tsdb.writePoint('data', 64, Date.now());
	tsdb.writePoint('data', 65, Date.now());
	tsdb.writePoint('data', 66, Date.now());
	tsdb.writePoint('data', 67);
	const minAgo = Date.now() - 5 * 60 * 1000;
	const dps = tsdb.retrieveDataSeries(minAgo, Date.now());
	notifyWatch(`In TSDB: ${JSON.stringify(dps)}`);
};
