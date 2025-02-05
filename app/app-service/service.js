import * as notificationMgr from '@zos/notification';
import { Time } from '@zos/sensor';
import { BasePage } from '@zeppos/zml/base-page';
import { HeartRate, Sleep } from '@zos/sensor';
import { getProfile } from '@zos/user';
import { getDeviceInfo } from '@zos/device';
import { GoogleApi } from './google-api';
import { Sequence } from '@silver-zepp/sequence';

const timeSensor = new Time();
const storage = getApp().globals.storage;
const tsdb = getApp().globals.tsdb;
const debug = true;
const SEND_INTERVAL = 1; // in minutes


//TODO address another issue mentioned by Silver: "Another small issue is here. QuickJS doesn't have .error method so your notifyWatch will never execute. Just use .log for everything"


AppService(
	BasePage({
		onInit() {
			const token = storage.getKey('token');
			const refreshToken = storage.getKey('refreshToken');
			const expiryDate = storage.getKey('expiresAt');
			const googleApi = new GoogleApi(this, token, refreshToken, expiryDate, null); //the "null" is the sheetId instance variable of google-api.js, which is set at the time of sheet creation

			notifyWatch(`Starting service, token is here? ${!!token}`);
			
			let currentSheetId = null;

			//function A

			function checkOrCreateFolder(folderName = "test") { // Check if the Google Drive folder exists, if not, create it
				if (!storage.getKey('zeppGoogleFolderId')) { 
					googleApi.createNewGoogleDriveFolder(folderName) // TODO change "test" to the user's Google account name, maybe like "John Doe - Zepp Data"
					.then((response) => {
						console.log('New folder created:', response);

						const zeppGoogleFolderId = response.id; 
						storage.setKey('zeppGoogleFolderId', zeppGoogleFolderId);
				
						notifyWatch(`Created new Google Drive folde: ${response.name} (ID: ${response.id})`); 

					})
					.catch((error) => {
						console.error('Failed to create new Google Drive folder:', error);
						notifyWatch(`Failed to create new Google Drive folder: ${error.message}`);
					});
				}
			}




			//function B
			//TODO 2/5/2025 1:54 AM (left off) in this method removed a check for: if (!currentSheetId) { // If there's no sheet at the time when onInit is invoked, create a new one for the current day (so we don't have to wait for onPerDay() to happen)
			// do this check manually later, when i call createNewSheet() function

			//use functions tom odel off what was previously done (in the PR basically) and then implement silver's async thingy
			function createNewSheet() {
				const today = new Date();
				const dateTitle = today.toISOString().split('T')[0]; // e.g., "2025-01-24"

				const folderId = storage.getKey('zeppGoogleFolderId');
				if (!folderId) {
					console.error("No folderId found in storage! Cannot create sheet.");
					return;
				}
				googleApi
					.createNewGoogleSheet(`zepp ${dateTitle}`, folderId) // in google-api.js, this will use setter method to set the sheetId instance variable before .then() happens
					.then((response) => {
						this.log('New spreadsheet created inside of onInit:', response);
						this.log('Created spreadhseet in folder inside of onInit:', folderId);

						const spreadsheetId = response.spreadsheetId; // get id of the new sheet
						storage.setKey('currentSheetId', spreadsheetId); // save the id to storage

						notifyWatch(`Created new Google Sheet inside of onInit: ${response.spreadsheetUrl} in folder ${folderId}`); //TODO this just prints the folderID which is like a url id, printing the actual folder name needs another API call I think
				})
				.catch((error) => {
					this.log('Failed to create a new Google Sheet inside of onInit', error.message);
					notifyWatch(
						`Failed to create a new Google Sheet inside of onInit: ${JSON.stringify(error.message)}`,
					);
				});
				
			}




			//function C

			function sendDataToGoogle() {
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


			
			checkOrCreateFolder(); // Call function A



			


			timeSensor.onPerMinute(() => {
				this.log(
					`Time report: ${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
				);

				// Every minute, save metrics to TSDB
				// saveToTSDB(this.getMetrics());
				if (timeSensor.getMinutes() % SEND_INTERVAL == 0) {
					sendDataToGoogle();
				}
			});

			timeSensor.onPerDay(() => {
				this.log(
					`Time report: ${timeSensor.getDay()}:${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
					// TODO change this to be more clear depending on what format you want
				);

				// Generate the current date as the title
				const today = new Date();
				const dateTitle = today.toISOString().split('T')[0]; // e.g., "2025-01-24"

				// Get folder id to store sheet in
				const folderId = storage.getKey('zeppGoogleFolderId');
				if (!folderId) {
					console.error("No folderId found in storage! Cannot create sheet.");
					return;
				  }

				googleApi
					.createNewGoogleSheet(`zepp ${dateTitle}`, folderId)
					.then((response) => {
						this.log('New spreadsheet created:', response);
						this.log('Created spreadhseet in folder:', folderId);

						const spreadsheetId = response.spreadsheetId; // get id of the new sheet
						storage.setKey('currentSheetId', spreadsheetId); // save the id to storage

						notifyWatch(`Created new Google Sheet: ${response.spreadsheetUrl} in folder ${folderId}`); //TODO this just prints the folderID which is like a url id, printing the actual folder name needs another API call I think
				})
				.catch((error) => {
					this.log('Failed to create a new Google Sheet', error.message);
					notifyWatch(
						`Failed to create a new Google Sheet: ${JSON.stringify(error.message)}`,
					);
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
