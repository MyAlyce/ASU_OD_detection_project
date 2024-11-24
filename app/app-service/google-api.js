import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT_URI } from "../google-api-constants";

/**
 * Request Google Auth Data from Google API after receiving auth code 
 * @param authResponse the auth code from Google API
 * @returns access token and other data for using API
 */
export const requestGoogleAuthData = async (authResponse) => {
    const params = {
        grant_type: 'authorization_code',
        client_id: GOOGLE_API_CLIENT_ID,
        client_secret: GOOGLE_API_CLIENT_SECRET,
        redirect_uri: GOOGLE_API_REDIRECT_URI,
        code: authResponse.code
    };

    const body = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    // console.log(body)
    const data = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    })
    return await data.json();
}

/**
 * Public-facing function to send data to Google Sheets
 * 
 * @param {object} svc the service object
 * @param {string} accessToken access token from Google API
 * @param {object[]} data data to send to Google Sheets, as an array of objects
 * 
 * @returns {Promise<object>} the response from the Google Sheets API
 */
export const sendDataToGoogleSheets = (svc, accessToken, data) => {
    // Format the data into headers and values

    // TODO: headers should be decided in internal function too
    // i.e. only add headers if creating new file (not appending to an existing one)
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

    /**
     * Format each entry into its own array
     */
    const dataRows = data.map(entry => {
        return [
            new Date(entry.recordTime * 1000).toISOString(),
            JSON.stringify(entry.user),
            JSON.stringify(entry.device),
            entry.heartRateLast,
            entry.heartRateResting,
            JSON.stringify(entry.heartRateSummary),
            JSON.stringify(entry.sleepInfo),
            JSON.stringify(entry.sleepStageList),
            JSON.stringify(entry.sleepStatus)
        ];
    })

    /**
     * Google Sheets API requires data to be a 2D array where every element is an array of values for a given row
     * (think of it in terms of rows/columns in a spreadsheet)
     */
    const formattedData = [headers, ...dataRows];
    console.log(formattedData);

    return internalSendDataToGoogleSheets(
        svc,
        accessToken,
        formattedData,
    ).then(({ status, body }) => {
        if (status == 200 && body?.updatedCells > 0) {
            console.log('Successfully wrote to Google Sheets:', body);
            return { message: `Successfully wrote ${body.updatedCells} cells.` };
        }
        return Promise.reject({ message: body });
    })
}

/**
 * Internal function to send data to Google Sheets
 * Do not use directly
 * 
 * @param {object} svc the service object
 * @param {string} accessToken access token from Google API
 * @param {object[]} values the data to send in a 2D array, each row is an array of values that get written to the same row
 * 
 * @returns {Promise<object>} the response from the Google Sheets API
 */
const internalSendDataToGoogleSheets = (svc, accessToken, values) => {
    // TODO: spreadsheetId, location, isColumn should be decided in this function (probably not passed in)
    // append vs new sheet 
    const spreadsheetId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // Replace with actual spreadsheet ID
    const range = 'Sheet1!A1';

    const body = {
        range,
        values,
        majorDimension: 'ROWS',
    };

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    // const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    return svc.httpRequest({
        method: 'PUT',
        url,
        body: JSON.stringify(body),
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    }).then(({ status, statusText, headers, body }) => {
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }
        return { status, body };
    })
};
