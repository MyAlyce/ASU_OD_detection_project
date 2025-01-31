export const createSettingsStore = (storage) => {
	const state = {
		isUserSignedIn: false,
		authView: null,
		shareEmailInput: null,
		signOutBtn: null,
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
