import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
	GOOGLE_API_REDIRECT_URI,
} from '../../google-api-constants';

//note this import makes it broken so dont use
// import { useSettings } from '../context/SettingsContext';
// const settings = useSettings(); // to get folder ID from setting's storage for sharing

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
		code: authResponse.code,
	};

	const body = Object.keys(params)
		.map(
			(key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
		)
		.join('&');

	const data = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body,
	});
	return await data.json();
};

export const shareFilesWithEmail = async (address, accessToken) => {
	const fileId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // todo remove hardcode, share with folder
	//const fileId = settings.getFolderId(); // get folder ID from settings storage

	const body = JSON.stringify({
		role: 'reader',
		type: 'user',
		value: address,
	});

	try {
		const response = await fetch(
			`https://www.googleapis.com/drive/v2/files/${fileId}/permissions`,
			{
				method: 'POST',
				body,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		);
		if (!response.ok) {
			throw new Error(`Failed to share file: ${response.statusText}`);
		}
		const result = await response.json();
		return { success: true, permissionId: result.id };
	} catch (error) {
		return { success: false };
	}
};

export const removeFilePermissionById = async (permissionId, accessToken) => {
	const fileId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // TODO: Remove hardcoding
	//const fileId = settings.getFolderId(); // get folder ID from settings storage

	const response = await fetch(
		`https://www.googleapis.com/drive/v2/files/${fileId}/permissions/${permissionId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to remove permission: ${response.statusText}`);
	}
	return { success: true };
};
