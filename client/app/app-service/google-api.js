import * as notificationMgr from '@zos/notification';
import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
} from '../google-api-constants';

const storage = getApp().globals.storage;

export class GoogleApi {
	constructor(svc, accessToken, refreshToken, expiryDate) {
		this.svc = svc;

		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiryDate = expiryDate;
		this.folderId = storage.getKey('zeppGoogleFolderId') || null;
		this.currentSheetId = storage.getKey('currentSheetId') || null;
	}

	setFolderId(folderId) {
		storage.setKey('zeppGoogleFolderId', folderId);
		this.folderId = folderId;
	}

	getFolderId() {
		return this.folderId || storage.getKey('zeppGoogleFolderId') || null;
	}

	setSheetId(sheetId) {
		storage.setKey('currentSheetId', sheetId);
		this.currentSheetId = sheetId;
	}

	getSheetId() {
		return this.currentSheetId || storage.getKey('currentSheetId') || null;
	}

	// Check if the Google Drive folder exists, if not, create it
	checkOrCreateFolder(folderName = 'test') {
		notifyWatch('Checking for Google Drive folder in google-api.js...');

		if (this.getfolderId()) {
			notifyWatch(
				'Promise Resolved: In g-api.js, verified that a folder already exists',
			);

			return Promise.resolve('verified that a folder already exists');
		}

		return this.createNewGoogleDriveFolder(folderName) // return a promise from this function
			.then((response) => {
				this.setFolderId(response.id);

				notifyWatch(
					`Promise Resolved: In g-api.js, made new GD folder: ${response.name} (ID: ${response.id}) and key: ${storage.getKey('zeppGoogleFolderId')}`,
				);

				return Promise.resolve('folder creation success'); // return a resolved promise
			})
			.catch((error) => {
				notifyWatch(
					`Promise Rejected: In g-api.js, failed to create a new Google Drive folder: ${error.message}`,
				);

				return Promise.reject(
					`failed to create a new Google Drive folder: ${error.message}`,
				); // return a rejected promise
			});
	}

	// Create a new Google Sheet assuming prerequisites are met (i.e. the folder exists)
	createNewSheet(newDay = false) {
		notifyWatch('Calling createNewSheet() in google-api.js...');

		if (!this.getfolderId()) {
			notifyWatch('Promise Rejected: No folder ID found in g-api.js');

			return Promise.reject('No folder ID found');
		}

		const folderId = this.getfolderId();

		if (this.getSheetId() && !newDay) {
			notifyWatch('Promise Resolved: Sheet already exists for the current day');

			return Promise.resolve('Sheet already exists for the current day');
		}

		const today = new Date();
		const dateTitle = today.toISOString().split('T')[0]; // e.g., "2025-01-24"

		return this.createNewGoogleSheet(`zepp ${dateTitle}`, folderId) // createNewGoogleSheet will use the setter method to set the sheetId instance variable before .then() happens
			.then((response) => {
				notifyWatch(
					`Promise Resolved: In g-api.js, made a new Google Sheet: ${response.spreadsheetId} in folder ${folderId}`,
				);

				return Promise.resolve('Sheet creation success'); // return a resolved promise
			})
			.catch((error) => {
				notifyWatch(
					`Promise Rejected: In g-api.js, failed to create a new Google Sheet: ${JSON.stringify(error.message)}`,
				);

				return Promise.reject(`Failed to create new sheet: ${error.message}`); // return a rejected promise
			});
	}

	/**
	 * Public-facing function to send data to Google Sheets
	 *
	 * @param {object[]} data data to send to Google Sheets, as an array of objects
	 * @returns {Promise<object>} the response from the Google Sheets API
	 */
	sendDataToGoogleSheets(data, addHeaders = false) {
		/**
		 * Google Sheets API requires data to be a 2D array where every element is an array of values for a given row
		 * (think of it in terms of rows/columns in a spreadsheet)
		 */

		// TODO: headers should be decided in internal function too
		// i.e. only add headers if creating new file (not appending to an existing one)

		const headers = [
			'Record Time',
			'Last Heart Rate',
			'Resting Heart Rate',
			'Daily Heart Rate Maximum',
			'Daily Heart Rate Time',
			'Daily Heart Rate Time Zone',
			'Daily Heart Rate Value',
			'Sleep Score',
			'Sleep Start Time',
			'Sleep End Time',
			'Sleep Deep Time',
			'Sleep Total Time',
			'Sleep Wake Stage',
			'Sleep REM Stage',
			'Sleep Light Stage',
			'Sleep Deep Stage',
		];

		// Format each entry into its own array, respecting permissions
		const dataRows = data.map((entry) => {
			const heartRateSummary = entry.heartRateSummary || {};
			const sleepInfo = entry.sleepInfo || {};
			const sleepStages = entry.sleepStageList || {};

			// Create an array with the timestamp (always included)
			const row = [new Date(entry.recordTime * 1000).toISOString()];

			// Add heart rate data (or permission denied message if not permitted)
			row.push(
				entry.heartRateLast !== undefined ? entry.heartRateLast : 'Permission Denied: Heart Rate',
				entry.heartRateResting !== undefined ? entry.heartRateResting : 'Permission Denied: Heart Rate',
				heartRateSummary.maximum?.maximum !== undefined ? heartRateSummary.maximum?.maximum : 'Permission Denied: Heart Rate',
				heartRateSummary.maximum?.time !== undefined ? heartRateSummary.maximum?.time : 'Permission Denied: Heart Rate',
				heartRateSummary.maximum?.time_zone !== undefined ? heartRateSummary.maximum?.time_zone : 'Permission Denied: Heart Rate',
				heartRateSummary.maximum?.hr_value !== undefined ? heartRateSummary.maximum?.hr_value : 'Permission Denied: Heart Rate'
			);

			// Add sleep info data (or permission denied message if not permitted)
			row.push(
				sleepInfo.score !== undefined ? sleepInfo.score : 'Permission Denied: Sleep Score',
				sleepInfo.startTime !== undefined ? sleepInfo.startTime : 'Permission Denied: Start/End Time',
				sleepInfo.endTime !== undefined ? sleepInfo.endTime : 'Permission Denied: Start/End Time',
				sleepInfo.deepTime !== undefined ? sleepInfo.deepTime : 'Permission Denied: Deep Sleep Time',
				sleepInfo.totalTime !== undefined ? sleepInfo.totalTime : 'Permission Denied: Total Sleep Time'
			);

			// Add sleep stage data (or permission denied message if not permitted)
			row.push(
				sleepStages.WAKE_STAGE !== undefined ? sleepStages.WAKE_STAGE : 'Permission Denied: Wake Stage',
				sleepStages.REM_STAGE !== undefined ? sleepStages.REM_STAGE : 'Permission Denied: REM Stage',
				sleepStages.LIGHT_STAGE !== undefined ? sleepStages.LIGHT_STAGE : 'Permission Denied: Light Stage',
				sleepStages.DEEP_STAGE !== undefined ? sleepStages.DEEP_STAGE : 'Permission Denied: Deep Stage'
			);

			return row;
		});

		// Add headers to the data if requested
		const formattedData = addHeaders ? [headers, ...dataRows] : dataRows;

		return this.#internalSendDataToGoogleSheets(formattedData).then(
			({ status, body }) => {
				if (status == 200) {
					console.log('Successfully wrote to Google Sheets:', body);
					return { message: `Successfully wrote to Google Sheets` };
				}
				return Promise.reject({ message: body });
			},
		);
	}

	/**
	 * Internal function to send data to Google Sheets. Do not use directly!
	 *
	 * @param {object} svc the service object
	 * @param {object[]} values the data to send in a 2D array, each row is an array of values that get written to the same row
	 *
	 * @returns {Promise<object>} the response from the Google Sheets API
	 */

	#internalSendDataToGoogleSheets(values) {
		const spreadsheetId = this.getSheetId();
		const range = 'Sheet1!A1';

		const body = {
			range,
			values,
			majorDimension: 'ROWS',
		};

		// const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

		return this.#refreshAccessToken().then(() => {
			return this.svc
				.httpRequest({
					method: 'POST',
					url,
					body: JSON.stringify(body),
					headers: {
						Authorization: `Bearer ${this.accessToken}`,
						'Content-Type': 'application/json',
					},
				})
				.then(({ status, statusText, headers, body }) => {
					if (typeof body === 'string') {
						try {
							body = JSON.parse(body);
						} catch (e) {
							return Promise.reject({ status, body: 'Invalid JSON response' });
						}
					}
					return { status, body };
				});
		});
	}

	#refreshAccessToken() {
		// Check if the access token is expiring in the next 5 minutes
		const now = new Date();
		const expiryDate = new Date(this.expiryDate);
		const isExpired = expiryDate - now < 5 * 60 * 1000;
		if (!isExpired) {
			return Promise.resolve();
		}

		// Refresh the access token
		const params = {
			grant_type: 'refresh_token',
			client_id: GOOGLE_API_CLIENT_ID,
			client_secret: GOOGLE_API_CLIENT_SECRET,
			refresh_token: this.refreshToken,
		};

		return this.svc
			.httpRequest({
				method: 'POST',
				url: 'https://oauth2.googleapis.com/token',
				body: JSON.stringify(params),
			})
			.then(({ status, body }) => {
				if (status === 200 || status === 201) {
					if (typeof body === 'string') {
						body = JSON.parse(body);
					}
					this.setSheetId(body.spreadsheetId); // Save the ID of the new sheet
					if (folderId) {
						return this.moveFileToFolder(body.spreadsheetId, folderId)
							.then(() => body)
							.catch((_err) => body);
					}

					return body;
				}
				return Promise.reject(`Failed to create spreadsheet: ${status}`);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Move a file to a specified Google Drive folder
	 *
	 * @param {string} fileId The ID of the file to move
	 * @param {string} folderId The ID of the folder to move the file into
	 * @returns {Promise<void>}
	 */
	moveFileToFolder(fileId, folderId) {
		const url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=root&fields=id,parents`;

		return this.svc
			.httpRequest({
				method: 'PATCH',
				url,
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			})
			.then(({ status, body }) => {
				if (status === 200) {
					console.log(`File ${fileId} moved to folder ${folderId}`);
				} else {
					return Promise.reject(`Failed to move file: ${status}`);
				}
			})
			.catch((err) => {
				console.error('Error moving file to folder:', err);
				throw err;
			});
	}

	/**
	 * Create a new folder in Google Drive
	 *
	 * @param {string} folderName - The name of the new folder to create.
	 * @returns {Promise<object>} - The response from the Google Drive API with the created folder's details
	 */
	createNewGoogleDriveFolder(folderName = 'test') {
		return this.svc
			.httpRequest({
				method: 'POST',
				url: 'https://www.googleapis.com/drive/v3/files',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: folderName,
					mimeType: 'application/vnd.google-apps.folder',
				}),
			})
			.then(({ status, body }) => {
				if (typeof body === 'string') {
					body = JSON.parse(body);
				}
				if (status === 200 || status === 201) {
					notifyWatch(
						`Inside google-api.js, via createNewGoogleDriveFolder(): Folder created: ${body.id}`,
					);
					return body;
				}
				notifyWatch(
					`Inside google-api.js, via createNewGoogleDriveFolder(): Failed to create folder: ${body.error?.message || status}`,
				);
				return Promise.reject(
					`Inside google-api.js, via createNewGoogleDriveFolder(): Failed to create folder: ${body.error?.message || status}`,
				);
			});
	}

	/**
	 * Searches for a folder in Google Drive
	 *
	 * @param {string} folderName - The name of the new folder to search for
	 * @returns {Promise<object>} - The response from the Google Drive API
	 */
	searchGoogleDriveFolder(folderName) {
		return this.svc
			.httpRequest({
				method: 'GET',
				url: `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			})
			.then(({ status, body }) => {
				if (typeof body === 'string') {
					body = JSON.parse(body);
				}
				if (status === 200) {
					return body.files || []; // Return array of matching folders
				}
				notifyWatch(
					`Failed to search for folder: ${body.error?.message || status}`,
				);
				return Promise.reject(
					`Failed to search for folder: ${body.error?.message || status}`,
				);
			});
	}

	/**
	 * Create a new Google Sheet
	 *
	 * @param {string} title The title of the new spreadsheet
	 * @param {string | null} folderId The ID of the folder in which to create the new spreadsheet
	 * @returns {Promise<object>} The response from the Google Sheets API with the created spreadsheet's details
	 */
	createNewGoogleSheet(title, folderId = null) {
		const url = 'https://sheets.googleapis.com/v4/spreadsheets';
		const body = {
			properties: {
				title: title || 'Untitled Spreadsheet',
			},
		};

		return this.svc
			.httpRequest({
				method: 'POST',
				url,
				body: JSON.stringify(body),
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			})
			.then(({ status, body }) => {
				if (status === 200 || status === 201) {
					if (typeof body === 'string') {
						body = JSON.parse(body);
					}
					this.setSheetId(body.spreadsheetId); // Save the ID of the new sheet
					if (folderId) {
						return this.moveFileToFolder(body.spreadsheetId, folderId)
							.then(() => body)
							.catch((_err) => body);
					}
					return body;
				}
				return Promise.reject(`Failed to create spreadsheet: ${status}`);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Move a file to a specified Google Drive folder
	 *
	 * @param {string} fileId The ID of the file to move
	 * @param {string} folderId The ID of the folder to move the file into
	 * @returns {Promise<void>}
	 */
	moveFileToFolder(fileId, folderId) {
		const url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=root&fields=id,parents`;

		return this.svc
			.httpRequest({
				method: 'PATCH',
				url,
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			})
			.then(({ status, body }) => {
				if (status === 200) {
					console.log(`File ${fileId} moved to folder ${folderId}`);
				} else {
					return Promise.reject(`Failed to move file: ${status}`);
				}
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Create a new folder in Google Drive
	 *
	 * @param {string} folderName - The name of the new folder to create.
	 * @returns {Promise<object>} - The response from the Google Drive API with the created folder's details
	 */
	createNewGoogleDriveFolder(folderName = 'test') {
		return this.svc
			.httpRequest({
				method: 'POST',
				url: 'https://www.googleapis.com/drive/v3/files',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: folderName,
					mimeType: 'application/vnd.google-apps.folder',
				}),
			})
			.then(({ status, body }) => {
				if (typeof body === 'string') {
					body = JSON.parse(body);
				}
				if (status === 200 || status === 201) {
					notifyWatch(
						`Inside google-api.js, via createNewGoogleDriveFolder(): Folder created: ${body.id}`,
					);
					return body;
				}
				notifyWatch(
					`Inside google-api.js, via createNewGoogleDriveFolder(): Failed to create folder: ${body.error?.message || status}`,
				);
				return Promise.reject(
					`Inside google-api.js, via createNewGoogleDriveFolder(): Failed to create folder: ${body.error?.message || status}`,
				);
			});
	}

	/**
	 * Searches for a folder in Google Drive
	 *
	 * @param {string} folderName - The name of the new folder to search for
	 * @returns {Promise<object>} - The response from the Google Drive API
	 */
	searchGoogleDriveFolder(folderName) {
		return this.svc
			.httpRequest({
				method: 'GET',
				url: `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			})
			.then(({ status, body }) => {
				if (typeof body === 'string') {
					body = JSON.parse(body);
				}
				if (status === 200) {
					return body.files || []; // Return array of matching folders
				}
				notifyWatch(
					`Failed to search for folder: ${body.error?.message || status}`,
				);
				return Promise.reject(
					`Failed to search for folder: ${body.error?.message || status}`,
				);
			});
	}
}

const debug = false;
const notifyWatch = (content) => {
	if (debug) {
		notificationMgr.notify({
			title: 'MyAlyce',
			content,
			actions: [],
		});
	}
};
