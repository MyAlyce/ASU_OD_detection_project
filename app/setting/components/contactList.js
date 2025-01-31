import { removeFilePermissionById } from '../util/google';
import { XButton } from './button';

/**
 *
 * @param {object} contacts list of contacts
 * @returns {Array<Contact>} list of Contact elements to display
 */
export const ContactList = (contacts, accessToken, setSetting) => {
	console.log('contacts:', contacts);

	const contactsMap = new Map(Object.entries(contacts));
	const list = [];
	for (const [contact, permissionId] of contactsMap) {
		list.push(
			Contact(contact, () => {
				removeFilePermissionById(permissionId, accessToken).then((result) => {
					if (result.success) {
						console.log('Successfully removed contact:', contact);
						contactsMap.delete(contact);
						const updatedContacts = Object.fromEntries(contactsMap);
						setSetting('contactsList', updatedContacts);
					} else {
						console.error('Failed to remove contact:', contact);
					}
				});
			}),
		);
	}

	return list;
};

const Contact = (contact, onClick) => {
	const removeContact = XButton(onClick);
	return View({ style: { display: 'flex', gap: '10px' } }, [
		contact,
		removeContact,
	]);
};
