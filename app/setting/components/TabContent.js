import { ContactList } from './contactList';
import { RescuePlan } from './rescue';
import {
	createAuthView,
	createShareEmailInput,
	createSignOutButton,
} from '../util/createViews';
import { useSettings } from '../context/SettingsContext';

// This file should be used to define the different tabs shown in settings.
// The tabs are defined as functions that return the pseudo-JSX for the tab content.

export const SettingsTab = () => {
	const store = useSettings();
	const isUserSignedIn = !!store.getAuthToken();
	return View(
		{ style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
		[
			isUserSignedIn ? createShareEmailInput() : createAuthView(),
			isUserSignedIn && View({}, createSignOutButton()),
		],
	);
};

export const ContactsTab = () => {
	const store = useSettings();
	if (!store.getAuthToken()) {
		console.error('No access token found');
		return Text({}, 'No access token found. Please sign in first.');
	}
	const items = ContactList();
	console.log(store);
	return items.length
		? items
		: Text({}, 'No contacts found. Add some in your Settings tab.');
};

export const AboutTab = () => Text({ style: { fontSize: '12px' } }, 'TODO');

export const RescueTab = () => {
	const store = useSettings();
	if (!store.getAuthToken()) {
		console.error('No access token found');
		return Text({}, 'No access token found. Please sign in first.');
	}
	return View(
		{ style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
		[RescuePlan()],
	);
};

export const TAB_COMPONENTS = {
	Settings: SettingsTab,
	Contacts: ContactsTab,
	About: AboutTab,
	Rescue: RescueTab,
};
