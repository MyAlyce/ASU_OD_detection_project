export default Tab = (label, isActive, onClick) => {
	const btn = Button({
		label,
		onClick,
		style: {
			flex: '1',
			boxShadow: 'none',
			background: isActive ? '#0088EE' : '#FFF',
			color: isActive ? '#FFF' : '#0088EE',
			display: 'inline',
			fontSize: '12px',
		},
	});
	return btn;
};
