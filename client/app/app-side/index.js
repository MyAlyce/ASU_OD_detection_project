import { BaseSideService, settingsLib } from '@zeppos/zml/base-side';

AppSideService(
	BaseSideService({
		onInit() {
			console.log('app side service invoke onInit');
		},

		onRun() {},

		onDestroy() {},

		onRequest(req, res) {
			console.log(`Method ==> ${req.method}`);
			if (req.method === 'GET_TOKEN') {
				const googleAuthData = settingsLib.getItem('googleAuthData');
				if (!googleAuthData) {
					res('No token found');
					return;
				}
				const parsedAuthData = JSON.parse(googleAuthData);
				res(null, {
					accessToken: parsedAuthData.access_token,
					refreshToken: parsedAuthData.refresh_token,
					expiresAt: parsedAuthData.expires_at,
				});
			} else if (req.method === 'GET_FOLDER_ID') {
				const folderId = settingsLib.getItem('zeppGoogleFolderId');
				if (!folderId) {
					res('No folder ID found');
					return;
				}
				res(null, { folderId });
			}
		},

		onCall(req) {
			console.log(`Method ==> ${req.method}`);
			if (req.method === 'SET_TOKEN_SETTINGS') {
				settingsLib.setItem(
					'googleAuthData',
					JSON.stringify({
						access_token: req.params.accessToken,
						refresh_token: req.params.refreshToken,
						expires_at: req.params.expiresAt,
					}),
				);
			} else if (req.method === 'UPDATE_FOLDER_ID') {
				console.log('UPDATE_FOLDER_ID method invoked');
				// hmUI.showToast({
				// 	text: 'Folder ID updated for sharing: ' + req.params.folderId
				// });
				settingsLib.setItem('zeppGoogleFolderId', req.params.folderId);
			}
		},

		onSettingsChange({ key, newValue, oldValue }) {
			console.log('onSettingsChange', key, newValue, oldValue);
			console.log(settingsLib.getAll());

			if (key === 'googleAuthData' && newValue) {
				const parsedValue = JSON.parse(newValue);
				console.log('googleAuthData changed');
				this.call({
					method: 'SET_TOKEN',
					params: {
						key: 'googleAuthData',
						accessToken: parsedValue.access_token,
						refreshToken: parsedValue.refresh_token,
						expiresAt: parsedValue.expires_at,
					},
				});
			}
		},
	}),
);
