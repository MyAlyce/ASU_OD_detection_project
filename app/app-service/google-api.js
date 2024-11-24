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

    const headers = [
        'Record Time',
        'Last Heart Rate',
        'Resting Heart Rate',
        // Daily Heart Rate broken down
        'Daily Heart Rate Maximum',
        'Daily Heart Rate Time',
        'Daily Heart Rate Time Zone',
        'Daily Heart Rate Value',
        // Sleep Info broken down
        'Sleep Score',
        'Sleep Start Time',
        'Sleep End Time',
        'Sleep Deep Time',
        'Sleep Total Time',
        // Sleep Stages broken down
        'Sleep Wake Stage',
        'Sleep REM Stage',
        'Sleep Light Stage',
        'Sleep Deep Stage',
    ];

    /**
     * Format each entry into its own array
    */
    const dataRows = data.map(entry => {
        // Parse the more complex objects
        const heartRateSummary = entry.heartRateSummary || {};
        const sleepInfo = entry.sleepInfo || {};
        const sleepStages = entry.sleepStageList || {};
        return [
            new Date(entry.recordTime * 1000).toISOString(),
            entry.heartRateLast,
            entry.heartRateResting,
            // // Daily Heart Rate data
            heartRateSummary.maximum?.maximum || 0,
            heartRateSummary.maximum?.time || 0,
            heartRateSummary.maximum?.time_zone || 0,
            heartRateSummary.maximum?.hr_value || 0,
            // Sleep Info data
            sleepInfo.score || 0,
            sleepInfo.startTime || 0,
            sleepInfo.endTime || -1,
            sleepInfo.deepTime || 0,
            sleepInfo.totalTime || 0,
            // Sleep Stages data
            sleepStages.WAKE_STAGE || 0,
            sleepStages.REM_STAGE || 0,
            sleepStages.LIGHT_STAGE || 0,
            sleepStages.DEEP_STAGE || 0,
        ];
    })

    /**
     * Google Sheets API requires data to be a 2D array where every element is an array of values for a given row
     * (think of it in terms of rows/columns in a spreadsheet)
     */

    // TODO: headers should be decided in internal function too
    // i.e. only add headers if creating new file (not appending to an existing one)
    const addHeaders = false;
    const formattedData = addHeaders ? [headers, ...dataRows] : dataRows;
    console.log(formattedData);

    return internalSendDataToGoogleSheets(
        svc,
        accessToken,
        formattedData,
    ).then(({ status, body }) => {
        // TODO: the append URL returns a different response than the write URL, so this should be handled differently
        if (status == 200) {
            console.log('Successfully wrote to Google Sheets:', body);
            // return { message: `Successfully wrote ${body.updatedCells} cells.` };
            return { message: `Successfully wrote to Google Sheets` };
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

    // const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    return svc.httpRequest({
        method: 'POST',
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
