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
			}
		},

		onSettingsChange({ key, newValue, oldValue }) {
			console.log('onSettingsChange', key, newValue, oldValue);
			console.log(settingsLib.getAll());
			if (key === 'googleAuthData') {
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
