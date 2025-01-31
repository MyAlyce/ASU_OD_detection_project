import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
	GOOGLE_API_REDIRECT_URI,
} from '../../google-api-constants';
import { PrimaryButton } from '../components/button';
import { shareFilesWithEmail, requestGoogleAuthData } from '../util/google';
import { Input } from '../components/textInput';

export const createAuthView = (ctx) => {
	const authView = Auth({
		label: PrimaryButton({
			label: 'Sign in',
		}),
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
			const authData = await requestGoogleAuthData(authBody);
			authData.requested_at = new Date();
			authData.expires_at = new Date(
				authData.requested_at.getTime() + authData.expires_in * 1000,
			);
			ctx.setSetting('googleAuthData', JSON.stringify(authData));
			console.log('authData', authData);
		},
	});
	return authView;
};

export const createShareEmailInput = (ctx) => {
	const ctx = getStore();
	const contactsList = ctx.getSetting('contactsList') || {};
	const shareEmailInput = Input(
		'Share with others',
		'Enter email address...',
		async (value) => {
			console.log('emailInput', value);
			const result = await shareFilesWithEmail(value, ctx.getAuthToken());
			if (!result.success) {
				ctx.setSetting('shareError', true);
				return;
			}
			contactsList[value] = result.permissionId;
			ctx.setSetting('contactsList', contactsList);
		},
	);
	return shareEmailInput;
};

export const createSignOutButton = (ctx) => {
	const signOutBtn = PrimaryButton({
		label: 'Sign out',
		onClick: () => {
			ctx.setSetting('googleAuthData', null);
			ctx.setSetting('googleAuthCode', null);
		},
	});
	return signOutBtn;
};
