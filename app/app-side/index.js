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
			if (req.method === 'POST_TO_GOOGLE') {
				console.log('req.body', req.body);
			} else if (req.method === 'GET_TOKEN') {
				const token = settingsLib.getItem('googleAuthData')
					? JSON.parse(settingsLib.getItem('googleAuthData')).access_token
					: undefined;
				if (token) {
					res(null, token);
				} else {
					res('No token found');
				}
			}
		},
		onSettingsChange({ key, newValue, oldValue }) {
			console.log('onSettingsChange', key, newValue, oldValue);
			console.log(settingsLib.getAll());
			if (key === 'googleAuthData') {
				console.log('googleAuthData changed');
				this.call({
					method: 'SET_TOKEN',
					params: {
						key: 'googleAuthData',
						value: JSON.parse(newValue).access_token,
					},
				});
			}
		},
	}),
);
