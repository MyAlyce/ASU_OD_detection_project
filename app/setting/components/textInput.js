export const Input = (label, placeholder, onChange) => {
	return TextInput({
		label,
		placeholder,
		onChange,
		subStyle: {
			border: 'thin rgba(0,0,0,0.1) solid',
			borderRadius: '8px',
			boxSizing: 'content-box',
			color: '#000',
			height: '.8em',
			lineHeight: '1.5em',
			marginTop: '-16px',
			padding: '8px',
			paddingTop: '1.2em',
		},
		labelStyle: {
			color: '#555',
			fontSize: '0.8em',
			paddingLeft: '8px',
			position: 'relative',
			top: '0.2em',
		},
	});
};
