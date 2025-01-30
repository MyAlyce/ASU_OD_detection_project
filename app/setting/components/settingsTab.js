import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
	GOOGLE_API_REDIRECT_URI,
} from '../../google-api-constants';

export const settingsTab = (userSignedIn) => {
	const signInBtn = PrimaryButton({
		label: 'Sign in',
	});
	const authDiv = Auth({
		label: signInBtn,
		authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		requestTokenUrl: 'https://oauth2.googleapis.com/token',
		scope: 'https://www.googleapis.com/auth/drive',
		clientId: GOOGLE_API_CLIENT_ID,
		clientSecret: GOOGLE_API_CLIENT_SECRET,
		oAuthParams: {
			redirect_uri: GOOGLE_API_REDIRECT_URI,
			response_type: 'code',
			include_granted_scopes: 'true',
			access_type: 'offline',
			prompt: 'consent',
		},
		onAccessToken: (token) => {
			console.log('onAccessToken', token);
		},
		onReturn: async (authBody) => {
			console.log('onReturn', authBody);
			// this.state.props.settingsStorage.setItem('googleAuthCode', authBody.code)
			const authData = await requestGoogleAuthData(authBody);
			authData.requested_at = new Date();
			authData.expires_at = new Date(
				authData.requested_at.getTime() + authData.expires_in * 1000,
			);
			this.state.props.settingsStorage.setItem(
				'googleAuthData',
				JSON.stringify(authData),
			);
			console.log('authData', this.state.googleAuthData);
		},
	});

	const clearBtn = PrimaryButton({
		label: 'Clear',
		onClick: () => {
			console.log('before clear', this.state.props.settingsStorage.toObject());
			props.settingsStorage.setItem('googleAuthData', null);
			props.settingsStorage.setItem('googleAuthCode', null);
			this.state.googleAuthData = '';
			console.log('after clear', this.state.props.settingsStorage.toObject());
		},
	});
	const clearDiv = View(
		{
			style: {
				display: 'inline',
			},
		},
		clearBtn,
	);
	return View(
		{
			style: {
				display: 'flex',
				flexDirection: 'column',
				gap: '10px',
			},
		},
		[userSignedIn ? clearDiv : authDiv],
	);
};
