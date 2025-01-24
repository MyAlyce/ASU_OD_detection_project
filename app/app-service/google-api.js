import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
} from '../google-api-constants';

const storage = getApp().globals.storage;

export class GoogleApi {
	constructor(svc, accessToken, refreshToken, expiresAt) {
		this.svc = svc;

		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}

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
		const expiryDate = new Date(this.expiresAt);
		const isExpired = expiryDate - now < 70 * 60 * 1000;
		if (!isExpired) {
			return Promise.resolve();
		}

		console.log('Refreshing access token...');
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
			.then(({ status, statusText, headers, body }) => {
				if (typeof body === 'string') {
					body = JSON.parse(body);
					return Promise.reject({ status, body: 'Invalid JSON response' });
				}
				const authData = {
					access_token: body.access_token,
					refresh_token: body.refresh_token || this.refreshToken,
				};
				authData.requested_at = new Date();
				authData.expires_at = new Date(
					authData.requested_at.getTime() + body.expires_in * 1000,
				);
				this.#updateAccessProperties(authData);
			});
	}

	#updateAccessProperties(authData) {
		this.accessToken = authData.access_token;
		this.refreshToken = authData.refresh_token;
		this.expiresAt = authData.expires_at;

		storage.setKey('token', this.accessToken);
		storage.setKey('refreshToken', this.refreshToken);
		storage.setKey('expiresAt', this.expiresAt);

		// Update the token stored in settings in the app-side
		this.svc.call({
			method: 'SET_TOKEN_SETTINGS',
			params: {
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
				expiresAt: this.expiresAt,
			},
		});
	}
}
