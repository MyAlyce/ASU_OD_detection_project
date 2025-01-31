import { ContactList } from './contactList';
import {
	createAuthView,
	createShareEmailInput,
	createSignOutButton,
} from '../util/createViews';

export const SettingsTab = (store) => {
	const state = store.getState();
	return View({ style: { display: 'flex', flexDirection: 'column' } }, [
		state.isUserSignedIn ? createShareEmailInput(store) : createAuthView(store),
		state.isUserSignedIn &&
			View({ style: { display: 'inline' } }, createSignOutButton(store)),
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
