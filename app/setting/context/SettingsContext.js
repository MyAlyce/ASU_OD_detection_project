/**
 * This file contains the settings context and the settings store.
 * The settings store is used to manage the settings of the app
 * and provide context to the settings components.
 * @param {object} storage settingsStorage object
 * @returns
 */
export const createSettingsStore = (settings, settingsStore) => {
	return {
		setState(key, value) {
			settingsStore.setItem(key, value);
		},
		getState() {
			return settings;
		},
		setSetting: (key, value) => settingsStore.setItem(key, value),
		getSetting: (key) => settingsStore.getItem(key),
		getAuthToken: () => {
			const authData = JSON.parse(settingsStore.getItem('googleAuthData'));
			return authData?.access_token || '';
		},
	};
};
