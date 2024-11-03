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
 * @param {*} accessToken access token from Google API
 * @param {*} data data to send to Google Sheets, as an object
 */
export const sendDataToGoogleSheets = async (accessToken, data) => {
    // TODO: spreadsheetId, location, isColumn should be decided in this function (probably not passed in)
    const spreadsheetId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // Replace with actual spreadsheet ID
    const location = 'Sheet1!A1'; // specify cell A1
    const isColumn = false; // isColumn set to false for row data

    // Format the data into headers and values
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

    const dataRow = [
        new Date(data.recordTime * 1000).toISOString(),
        JSON.stringify(data.user),
        JSON.stringify(data.device),
        data.heartRateLast,
        data.heartRateResting,
        JSON.stringify(data.heartRateSummary),
        JSON.stringify(data.sleepInfo),
        JSON.stringify(data.sleepStageList),
        JSON.stringify(data.sleepStatus)
    ];

    // Combine headers and data
    const formattedData = [headers, dataRow];

    try {
        const response = await internalSendDataToGoogleSheets(
            accessToken,
            formattedData,
            spreadsheetId,
            location,
            isColumn
        );
        if (response && response.updatedCells > 0) {
            console.log('Successfully wrote to Google Sheets:', response);
            return { success: true, data: response };
        } else {
            console.error('Failed to write to Google Sheets:', response);
            return { success: false, data: response };
        }
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        return { success: false, data: error };
    }
}

/**
 * Internal function to send data to Google Sheets
 * Do not use directly
 * @param {*} accessToken access token from Google API
 * @param {*} values the data to send
 * @param {*} spreadsheetId the ID of the Google Sheet
 * @param {*} range the range of the data to send
 * @param {*} isColumn if the data is a column or row
 * @returns 
 */
const internalSendDataToGoogleSheets = async (accessToken, values, spreadsheetId, range, isColumn) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    const body = {
        range: range,
        majorDimension: isColumn ? 'COLUMNS' : 'ROWS',
        values: values
    };
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const responseData = await response.json();
    console.log('Response from Google Sheets API:', responseData);
    return responseData;
};
