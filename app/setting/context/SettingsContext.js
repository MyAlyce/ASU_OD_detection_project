/**
 * This file contains the settings context and the settings store.
 * The settings store is used to manage the settings of the app
 * and provide context to the settings components.
 * @param {object} storage settingsStorage object
 * @returns
 */
let globalSettingsStore = null;

export const createSettingsStore = ({
	settings,
	settingsStorage: settingsStore,
}) => {
	const store = {
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
	globalSettingsStore = store;
	return store;
};

export const useSettings = () => {
	if (!globalSettingsStore) {
		throw new Error('Settings store must be initialized before use');
	}
	return globalSettingsStore;
};
