import { ContactList } from './contactList';

export const SettingsTab = (store) => {
	const state = store.getState();

	return View({}, [
		state.isUserSignedIn ? state.shareEmailInput : state.authView,
		state.isUserSignedIn &&
			View({ style: { display: 'inline' } }, state.signOutBtn),
	]);
};

export const ContactsTab = (store) => {
	const contacts = store.getSetting('contactsList') || {};
	return ContactList(contacts, store.getAuthToken(), store.setSetting);
};

export const AboutTab = () => Text({ style: { fontSize: '12px' } }, 'TODO');

export const TAB_COMPONENTS = {
	Settings: SettingsTab,
	Contacts: ContactsTab,
	About: AboutTab,
};
