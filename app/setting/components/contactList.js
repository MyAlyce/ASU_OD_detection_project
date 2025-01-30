import { PrimaryButton, XButton } from './button';

export const ContactList = (contactList) => {
	console.log(contactList);
	const list = contactList.map((c, idx) => Contact(c, idx));

	return list;
};

const Contact = (contact, idx) => {
	const removeContact = XButton(() => {
		console.log('remove contact:', contact);
	});
	return View({ style: { display: 'flex', gap: '10px' } }, [
		contact,
		removeContact,
	]);
};
