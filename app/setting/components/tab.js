export const Tab = (label, isActive, onClick) => {
	const btn = Button({
		label,
		onClick,
		style: {
			flex: '1',
			boxShadow: 'none',
			background: isActive ? '#000' : '#FFF',
			color: isActive ? '#FFF' : '#000',
			display: 'inline',
			fontSize: '12px',
		},
	});
	return btn;
};
