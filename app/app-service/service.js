import * as notificationMgr from '@zos/notification';
import { Time } from '@zos/sensor';
import { BasePage } from '@zeppos/zml/base-page';
import { HeartRate, Sleep } from '@zos/sensor';
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import { GoogleApi } from './google-api';
import { SequenceBG } from '@silver-zepp/sequence-bg';

const timeSensor = new Time();
const storage = getApp().globals.storage;
const tsdb = getApp().globals.tsdb;
const debug = true;
const SEND_INTERVAL = 1; // in minutes


//should run in onPerMinute() if and only if both the folder and sheet exist; data should be passed in from getMetrics()
function sendDataToGoogle(googleApi, data) {
	notifyWatch('Sending data to Google Sheets...'); // for debug

	const fiveMinutesAgo = Date.now() - 6 * 60 * 1000;
	const now = Date.now();
	notifyWatch(`data ${tsdb.retrieveDataSeries(fiveMinutesAgo, now)}`);

	//const data = [this.getMetrics()];

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

AppService(
	BasePage({
		onInit() {
			const token = storage.getKey('token');
			const refreshToken = storage.getKey('refreshToken');
			const expiryDate = storage.getKey('expiresAt');
			const googleApi = new GoogleApi( 
				this,
				token,
				refreshToken,
				expiryDate
			); 

			notifyWatch(`Starting service, token is here? ${!!token}`);

			// check if the folder exists, and if not, create it; then create a new sheet before proceeding
			googleApi.checkOrCreateFolder("test")
				.then((result) => {
					this.log('inside onInit, checkOrCreateFolder() result:', result);
					notifyWatch(`inside onInit, checkOrCreateFolder() result: ${result}`);

					googleApi.createNewSheet()
						.then((result) => {
							this.log('inside onInit, createNewSheet() result:', result);
							notifyWatch(`inside onInit, createNewSheet() result: ${result}`);
							// hopefully we get here
						})
						.catch((error) => {
							this.log('inside onInit, createNewSheet() error:', error);
							notifyWatch(`inside onInit, createNewSheet() error: ${error}`);
						});

				})
				.catch((error) => {
					this.log('inside onInit, checkOrCreateFolder() error:', error);
					notifyWatch(`inside onInit, checkOrCreateFolder() error: ${error}`);
				});

			timeSensor.onPerMinute(() => {
				this.log(
					`Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
				);

				// Every minute, save metrics to TSDB
				// saveToTSDB(this.getMetrics());
				if (timeSensor.getMinutes() % SEND_INTERVAL == 0) {
					try {
						this.sendMetricsToGoogleSheets(googleApi); // send data to Google Sheets every SEND_INTERVAL minutes
					} catch (error) {
						this.log(
							'Failed to send data to Google Sheets in onPerMinute()',
							error.message,
						);
					}
				}
			});

//TODO modify this for correctness after onPerMinute() is working
			timeSensor.onPerDay(() => {
				this.log(
					`Time report: ${timeSensor.getDay()}:${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
					// TODO change this to be more clear depending on what format you want
				);

				googleApi.createNewSheet(true) // every day, create a new sheet for that day and set it as the current sheet

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
		sendMetricsToGoogleSheets(googleApi) {
			notifyWatch('sending data to google sheets...')

			const fiveMinutesAgo = Date.now() - 6 * 60 * 1000;
			const now = Date.now();
			const data = [this.getMetrics()];

			notifyWatch(`data ${tsdb.retrieveDataSeries(fiveMinutesAgo, now)}`);

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
