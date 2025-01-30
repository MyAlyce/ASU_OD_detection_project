const setActiveTab = (tab) => {
	console.log('Active tab is: ', tab);
};
export default Tab = (label, isActive) => {
	const btn = Button({
		label,
		onClick: setActiveTab(label),
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
