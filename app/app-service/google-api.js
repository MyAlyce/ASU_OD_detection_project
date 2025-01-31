export class GoogleApi {
	constructor(svc, accessToken, refreshToken, expiryDate) {
		this.svc = svc;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiryDate = expiryDate;
	}

	// Write a function to refresh the access token
	// This function should be called before sending data to Google Sheets
	// The function should check if the access token is expired and refresh it if necessary
	// The function should return a promise that resolves with the new access token
	refreshAccessToken() {}

	/**
	 * Public-facing function to send data to Google Sheets
	 *
	 * @param {object[]} data data to send to Google Sheets, as an array of objects
	 * @returns {Promise<object>} the response from the Google Sheets API
	 */
	sendDataToGoogleSheets(data) {
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

		// Format each entry into its own array
		const dataRows = data.map((entry) => {
			const heartRateSummary = entry.heartRateSummary || {};
			const sleepInfo = entry.sleepInfo || {};
			const sleepStages = entry.sleepStageList || {};
			return [
				new Date(entry.recordTime * 1000).toISOString(),
				entry.heartRateLast,
				entry.heartRateResting,
				heartRateSummary.maximum?.maximum || 0,
				heartRateSummary.maximum?.time || 0,
				heartRateSummary.maximum?.time_zone || 0,
				heartRateSummary.maximum?.hr_value || 0,
				sleepInfo.score || 0,
				sleepInfo.startTime || 0,
				sleepInfo.endTime || -1,
				sleepInfo.deepTime || 0,
				sleepInfo.totalTime || 0,
				sleepStages.WAKE_STAGE || 0,
				sleepStages.REM_STAGE || 0,
				sleepStages.LIGHT_STAGE || 0,
				sleepStages.DEEP_STAGE || 0,
			];
		});

		const addHeaders = false;
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
		const spreadsheetId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU';
		const range = 'Sheet1!A1';

		const body = {
			range,
			values,
			majorDimension: 'ROWS',
		};

		// const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
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
					body = JSON.parse(body);
				}
				return { status, body };
			});
	}


	/**
	 * Create a new Google Sheet
	 *
	 * @param {string} title The title of the new spreadsheet
	 * @param {string | null} folderId The ID of the folder in which to create the new spreadsheet 
	 * @returns {Promise<object>} The response from the Google Sheets API with the created spreadsheet's details
	 */
	createNewGoogleSheet(title, folderId=null) {
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
					console.log(`Spreadsheet "${title}" created successfully!`, body);

					if (folderId) {
						return this.moveFileToFolder(body.spreadsheetId, folderId)
							.then(() => {
								console.log(`Spreadsheet moved to folder ${folderId}`);
								return body; // Ensure we return the spreadsheet details after moving
							})
							.catch((moveError) => {
								console.warn(`Failed to move spreadsheet into the proper folder: ${moveError.message}`);
								return body; // Return the spreadsheet details even if moving fails
							});
					}

					return body;
				}
				return Promise.reject(new Error(`Failed to create spreadsheet: ${status}`));
			})
			.catch((err) => {
				console.error('Error creating new spreadsheet:', err);
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
					return Promise.reject(new Error(`Failed to move file: ${status}`));
				}
			})
			.catch((err) => {
				console.error('Error moving file to folder:', err);
				throw err;
			});
	}

	/**
	 * Creates a new folder in Google Drive.
	 *
	 * @param {string} folderName - The name of the new folder to create.
	 * @returns {Promise<object>} - The response from the Google Drive API with the created folder's details
	 */
	createNewGoogleDriveFolder(folderName) {
		return this.svc.httpRequest({
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
		}).then(({ status, body }) => {
			if (typeof body === 'string') {
				body = JSON.parse(body);
			}
			if (status === 200 || status === 201) {
				return body;
			}
			return Promise.reject(new Error(`Failed to create folder: ${body.error?.message || status}`));
		});
		
	}

	/**
	 * Creates a new folder in Google Drive.
	 *
	 * @param {string} folderName - The name of the new folder to create
	 * @returns {Promise<object>} - The response from the Google Drive API 
	 */
	searchGoogleDriveFolder(folderName) {
		return this.svc.httpRequest({
		  method: 'GET',
		  url: `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
		  headers: {
			Authorization: `Bearer ${this.accessToken}`,
		  },
		}).then(({ status, body }) => {
		  if (typeof body === 'string') {
			body = JSON.parse(body);
		  }
		  if (status === 200) {
			return body.files || []; // Return array of matching folders
		  }
		  return Promise.reject(new Error(`Failed to search folder: ${body.error?.message || status}`));
		});
	  }
	  
	
}
