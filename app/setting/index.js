import {
	GOOGLE_API_CLIENT_ID,
	GOOGLE_API_CLIENT_SECRET,
	GOOGLE_API_REDIRECT_URI,
} from '../google-api-constants';
import { PrimaryButton } from './components/button';
import { Tabs } from './components/tabs';
import { VisibleToast } from './components/toast';

AppSettingsPage({
	state: {
		props: {},
		googleAuthData: null,
	},
	setState(props) {
		console.log('setState', props);
		this.state.props = props;
		const storedAuthData = JSON.parse(
			props.settingsStorage.getItem('googleAuthData'),
		);
		if (storedAuthData) {
			this.state.googleAuthData = storedAuthData;
		}
		if (this.isTokenExpired() || !this.state.googleAuthData) {
			this.state.googleAuthData = null;
		}
		if (!props.settingsStorage.getItem('activeTab')) {
			props.settingsStorage.setItem('activeTab', 'Settings');
		}
		console.log('state:', this.state);
	},
	build(props) {
		console.log('re-render');
		this.setState(props);

		const nowTag = new Date().toISOString().substring(0, 19);
		if (props.settingsStorage.getItem('now') !== nowTag)
			props.settingsStorage.setItem('now', nowTag);

		const currentTab = props.settingsStorage.getItem('activeTab');

		const userSignedIn = !!this.state.googleAuthData;
		const signInBtn = PrimaryButton({
			label: 'Sign in',
		});

		const clearBtn = PrimaryButton({
			label: 'Clear',
			onClick: () => {
				console.log(
					'before clear',
					this.state.props.settingsStorage.toObject(),
				);
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

		const shareEmailInput = TextInput({
			label: 'Share with others',
			placeholder: 'Enter email address...',
			onChange: async (value) => {
				console.log('emailInput', value);
				const data = await shareFilesWithEmail(
					value,
					this.state.googleAuthData.access_token,
				);
				if (data.error) {
					props.settingsStorage.setItem('shareError', true);
					return;
				}
				const currentList = props.settingsStorage.getItem('sharedList') || [];
				currentList.push(value);
				props.settingsStorage.setItem('sharedList', currentList);
			},
			subStyle: {
				border: 'thin rgba(0,0,0,0.1) solid',
				borderRadius: '8px',
				boxSizing: 'content-box',
				color: '#000',
				height: '.8em',
				lineHeight: '1.5em',
				marginTop: '-16px',
				padding: '8px',
				paddingTop: '1.2em',
			},
			labelStyle: {
				color: '#555',
				fontSize: '0.8em',
				paddingLeft: '8px',
				position: 'relative',
				top: '0.2em',
			},
		});

		const tt = Text(
			{
				style: {
					fontSize: '12px',
					marginTop: '10px',
				},
			},
			`Google Auth Data: ${JSON.stringify(this.state.googleAuthData)}`,
		);

		const list = props.settingsStorage.getItem('sharedList').map((email) => {
			return Text({ style: { fontSize: '12px' } }, email);
		});

		const authView = Auth({
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

		const addedUserToast = VisibleToast('User added');
		const failedToAddUserToast = VisibleToast('Failed to add user');

		const tabViews = {
			Settings: userSignedIn ? [clearDiv, shareEmailInput] : authView,
			Contacts: list,
			About: Text({ style: { fontSize: '12px' } }, 'TODO'),
		};
		return Section(
			{
				style: {
					padding: '10px',
				},
			},
			[
				Tabs(
					currentTab,
					props.settingsStorage.setItem.bind(props.settingsStorage),
				),
				View(
					{
						style: {
							display: 'flex',
							flexDirection: 'column',
							gap: '10px',
						},
					},
					tabViews[currentTab],
				),
			],
		);
	},

	isTokenExpired() {
		const authData = this.state.googleAuthData;
		if (!authData || !authData.expires_at) {
			return true;
		}
		const now = new Date();
		const expiresAt = new Date(authData.expires_at);
		return now >= expiresAt;
	},

	onDestroy() {
		console.log('destroy');
	},
});

/**
 * Request Google Auth Data from Google API after receiving auth code
 * @param authResponse the auth code from Google API
 * @returns access token and other data for using API
 */
const requestGoogleAuthData = async (authResponse) => {
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

	// console.log(body)
	const data = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body,
	});
	return await data.json();
};

const shareFilesWithEmail = async (address, accessToken) => {
	const fileId = '1e40yZOhM5_Wd5IQkwVJpPh23pohGgRiN3Ayp4fxYtzU'; // todo remove hardcode, share with folder
	const body = JSON.stringify({
		role: 'reader',
		type: 'user',
		value: address,
	});

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
	return await response.json();
};
