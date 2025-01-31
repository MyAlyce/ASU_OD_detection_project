export const createSettingsStore = (storage) => {
	const state = {
		isUserSignedIn: false,
	};

	return {
		setState(newState) {
			Object.assign(state, newState);
		},
		getState() {
			return state;
		},
		setSetting: (key, value) => storage.setItem(key, value),
		getSetting: (key) => storage.getItem(key),
		getAuthToken: () => {
			const authData = JSON.parse(storage.getItem('googleAuthData'));
			return authData?.access_token || '';
		},
	};
};
