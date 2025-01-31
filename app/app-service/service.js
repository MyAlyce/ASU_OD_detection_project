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


			// some example code that works is below for reference:

			// Create a new Google Sheet called "test"
			//this just does it once when onInit() is invoked

			// googleApi.createNewGoogleSheet('test').then((response) => {
			// 	console.log('New spreadsheet created:', response);
			// 	notifyWatch(`Created new Google Sheet: ${response.spreadsheetUrl}`);
			// }).catch((error) => {
			// 	console.error('Failed to create new Google Sheet:', error);
			// 	notifyWatch('Failed to create new Google Sheet');
			// });


			// Create a new Google Drive folder called "test"
			//this just does it once when onInit() is invoked

			// googleApi.createNewGoogleDriveFolder('test')
			// .then((response) => {
			// 	console.log('New folder created:', response);

			// 	const zeppGoogleFolderId = response.id; 
			// 	storage.setKey('zeppGoogleFolderId', zeppGoogleFolderId);
		
			// 	notifyWatch(`Created new Google Drive folder: ${response.name} (ID: ${response.id})`); 
			// 	// TODO: response.id contains the folder ID; implement the createNewGoogleSheet function to use this later
			// })
			// .catch((error) => {
			// 	console.error('Failed to create new Google Drive folder:', error);
			// 	notifyWatch(`Failed to create new Google Drive folder: ${error.message}`);
			// });


			// A working way to search for folders; but uses api calls so more expesnive than just checking local storage

			// googleApi.searchGoogleDriveFolder('test') 
			// .then((existingFolders) => {
			// 	if (existingFolders.length > 0) {
			// 	console.log('Folder already exists:', existingFolders[0]);
			// 	notifyWatch(`Folder already exists (ID: ${existingFolders[0].id})`); 
			// 	storage.setKey('zeppGoogleFolderId', existingFolders[0].id); // Store existing folder ID incase failed to set before
			// 	} 
			// 	else 
			// 	{
			// 		// Create a new folder if it doesn't exist
			// 	return googleApi.createNewGoogleDriveFolder('test')
			// 		.then((response) => {
			// 		console.log('New folder created:', response);
			// 		storage.setKey('zeppGoogleFolderId', response.id);
			// 		notifyWatch(`Created new Google Drive folder: ${response.name} (ID: ${response.id})`);
			// 		})
			// 		.catch((error) => {
			// 			console.error('Failed to create new Google Drive folder:', error);
			// 			notifyWatch(`Failed to create new Google Drive folder: ${error.message}`);
			// 		});
		
			// 	}
			// })
			// .catch((error) => {
			// 	console.error('Error checking or creating folder:', error);
			// 	notifyWatch(`Error: ${error.message}`);
			// });


			if (!storage.getKey('zeppGoogleFolderId')) { // this means a folder doesn't exist currently, so make a new one
				googleApi.createNewGoogleDriveFolder('test')
				.then((response) => {
					console.log('New folder created:', response);

					const zeppGoogleFolderId = response.id; 
					storage.setKey('zeppGoogleFolderId', zeppGoogleFolderId);
			
					notifyWatch(`Created new Google Drive folder: ${response.name} (ID: ${response.id})`); 
				})
				.catch((error) => {
					console.error('Failed to create new Google Drive folder:', error);
					notifyWatch(`Failed to create new Google Drive folder: ${error.message}`);
				});
			}
		

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

			timeSensor.onPerDay(() => {
				this.log(
					`Time report: ${timeSensor.getDay()}:${timeSensor.getHours()}:${timeSensor.getMinutes().toString().padStart(2, '0')}:${timeSensor.getSeconds().toString().padStart(2, '0')}`,
					//  change this to be more clear depending on what format u want
				);

				//also zepp hass ome inbuilt get date functions if u want https://docs.zepp.com/docs/reference/device-app-api/newAPI/sensor/Time/
				// but the current way works fine for making title so i left it


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

						notifyWatch(`Created new Google Sheet: ${response.spreadsheetUrl} in folder ${folderId}`);
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
