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

let headersAdded = storage.getKey('headersAdded') || false; // if DNE, that means it is the first time sending metrics to Sheets so we SHOULD add headers
let currentDay = storage.getKey('currentDay') || timeSensor.getDate(); // get the current day number, 1-31, of the month

const defaultFolderName = "Zepp - MyAlyce Folder"; // default folder name
AppService(
	BasePage({
		onInit() {
			const token = storage.getKey('token');
			const refreshToken = storage.getKey('refreshToken');
			const expiryDate = storage.getKey('expiresAt');
			const googleApi = new GoogleApi(this, token, refreshToken, expiryDate);

			notifyWatch(
				`Starting service, token is here? ${!!token} expires at ${expiryDate}`,
			);

			// check if the folder exists, and if not, create it; then create a new sheet before proceeding
			googleApi
				.checkOrCreateFolder(defaultFolderName) // check if the folder exists, and if not, create it')
				.then((result) => {
					this.log('inside onInit, checkOrCreateFolder() result:', result);
					notifyWatch(`inside onInit, checkOrCreateFolder() result: ${result}`);

					googleApi
						.createNewSheet()
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

				// if it is, for example, 2/15 12:00 AM right now, the currentDay value above will still be 14 (of the previous day) but dayAtThisInstant will be 15
				const dayAtThisInstant = timeSensor.getDate(); // get the current day number at this very moment, 1-31, of the month
				if (currentDay != dayAtThisInstant) {
					currentDay = dayAtThisInstant;
					storage.setKey('currentDay', dayAtThisInstant);

					googleApi.createNewSheet(true); // every new day, create a new sheet for that day and set it as the current sheet
					headersAdded = false; // set headersAdded to no so that we add headers again
					storage.setKey(headersAdded, false); // set headersAdded to no in storage as well
				}

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
			notifyWatch('sending data to google sheets...');

			const fiveMinutesAgo = Date.now() - 6 * 60 * 1000;
			const now = Date.now();
			const data = [this.getMetrics()];

			//notifyWatch(`data ${tsdb.retrieveDataSeries(fiveMinutesAgo, now)}`);
			notifyWatch('sending data; results of headersAdded: ' + !headersAdded);

			// todo: connectStatus() to check if the phone is connected
			googleApi
				.sendDataToGoogleSheets(data, !headersAdded) // should add headers if a new day happens (new sheet) or on the first run of the current sheet
				.then((res) => {
					if (!headersAdded) {
						storage.setKey('headersAdded', true); // set headersAdded to 'yes' so that we don't add headers again
						headersAdded = true;

						notifyWatch('headersAdded set to yes in storage');
					}

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
