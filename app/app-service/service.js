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

//TODO address another issue mentioned by Silver: "Another small issue is here. QuickJS doesn't have .error method so your notifyWatch will never execute. Just use .log for everything"

// Check if the Google Drive folder exists, if not, create it
function checkOrCreateFolder(googleApi) {
	if (storage.getKey('zeppGoogleFolderId')) {
		return Promise.resolve('folder already exists'); // if the folder id is already in storage, return a resolved promise
	}

	return googleApi // return a promise from this function
		.createNewGoogleDriveFolder('test') // TODO change "test" to the user's Google account name, maybe like "John Doe - Zepp Data"
		.then((response) => {
			console.log('New folder created:', response);

			const zeppGoogleFolderId = response.id;
			storage.setKey('zeppGoogleFolderId', zeppGoogleFolderId);
			notifyWatch(
				`Created new Google Drive folde: ${response.name} (ID: ${response.id})`,
			);
			return Promise.resolve('folder creation success'); // return a resolved promise
		})
		.catch((error) => {
			console.error('Failed to create new Google Drive folder:', error);
			notifyWatch(`Failed to create new Google Drive folder: ${error.message}`);
			return Promise.reject(`failed to create folder: ${error.message}`); // return a rejected promise
		});
}

// Create a new Google Sheet assuming prerequisites are met (i.e., the folder and sheet both exist)
function createNewSheet(googleApi, newDay = false) {
	if (currentSheetId && !newDay) {
		return Promise.resolve('sheet already exists'); // if the current sheet id exists and newDay is false, return a resolved promise
	}

	// if there is no current sheet id, or if newDay is true (which happens in onPerDay()'s context), create a new sheet
	if (!newDay) {
		this.log(
			"Sheet wasn't found for current onInit() instance, creating a new one...",
		);
	} else {
		this.log('Creating a new sheet for the new day...');
	}

	const folderId = storage.getKey('zeppGoogleFolderId');
	if (!folderId) {
		console.error('No folderId found in storage! Cannot create sheet.');
		return Promise.reject('No folderId found in storage! Cannot create sheet.');
	}

	const today = new Date();
	const dateTitle = today.toISOString().split('T')[0]; // e.g., "2025-01-24"

	return googleApi
		.createNewGoogleSheet(`zepp ${dateTitle}`, folderId) // in google-api.js, this will use setter method to set the sheetId instance variable before .then() happens
		.then((response) => {
			this.log('New spreadsheet created inside of onInit:', response);
			this.log('Created spreadhseet in folder inside of onInit:', folderId);

			const spreadsheetId = response.spreadsheetId; // get id of the new sheet
			storage.setKey('currentSheetId', spreadsheetId); // save the id to storage

			notifyWatch(
				`Created new Google Sheet inside of onInit: ${response.spreadsheetUrl} in folder ${folderId}`,
			); //TODO this just prints the folderID which is like a url id, printing the actual folder name needs another API call I think
			return Promise.resolve('sheet creation success'); // return a resolved promise
		})
		.catch((error) => {
			this.log(
				'Failed to create a new Google Sheet inside of onInit',
				error.message,
			);
			notifyWatch(
				`Failed to create a new Google Sheet inside of onInit: ${JSON.stringify(error.message)}`,
			);
			return Promise.reject(`failed to create sheet: ${error.message}`); // return a rejected promise
		});
}

//should run in onPerMinute() if and only if both the folder and sheet exist; data should be passed in from getMetrics()
function sendDataToGoogle(googleApi, data) {
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
				expiryDate,
				null,
			); //the "null" is the sheetId instance variable of google-api.js, which is set at the time of sheet creation

			notifyWatch(`Starting service, token is here? ${!!token}`);

			let currentSheetId = storage.getKey('currentSheetId') || null; // get the current sheet id from storage, if it exists

			// check if the folder exists, and if not, create it; then create a new sheet before proceeding
			checkOrCreateFolder(googleApi)
				.then((result) => {
					this.log('checkOrCreateFolder() result:', result);
					notifyWatch(`checkOrCreateFolder() result: ${result}`);

					createNewSheet(googleApi)
						.then((result) => {
							this.log('createNewSheet() result:', result);
							notifyWatch(`createNewSheet() result: ${result}`);
							// ideally we get to this point
						})
						.catch((error) => {
							this.log('createNewSheet() error:', error);
							notifyWatch(`createNewSheet() error: ${error}`);
						});
				})
				.catch((error) => {
					this.log('checkOrCreateFolder() error:', error);
					notifyWatch(`checkOrCreateFolder() error: ${error}`);
				});

			timeSensor.onPerMinute(() => {
				this.log(
					`Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
				);

				// Every minute, save metrics to TSDB
				// saveToTSDB(this.getMetrics());
				if (timeSensor.getMinutes() % SEND_INTERVAL == 0) {
					try {
						sendDataToGoogle(googleApi, this.getMetrics()); // send data to Google Sheets every SEND_INTERVAL minutes
					} catch (error) {
						this.log(
							'Failed to send data to Google Sheets in onPerMinute()',
							error.message,
						);
					}
				}
			});

			timeSensor.onPerDay(() => {
				this.log(
					`Time report: ${timeSensor.getDay()}:${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
					// TODO change this to be more clear depending on what format you want
				);

				createNewSheet(googleApi, true); // every day, create a new sheet for the new day
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
