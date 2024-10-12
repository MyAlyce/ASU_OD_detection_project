import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT_URI } from "../google-api-constants";

export const requestAccessToken = async (authResponse) => {
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

    console.log(body)
    const data = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    })
    console.log(data)
    const dataJson = await data.json();
    console.log(dataJson);
    return dataJson;
}