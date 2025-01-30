export default Tab = ({ label, onClick }) => {
	const btn = Button({
		label,
		onClick,
		style: {
			boxShadow: 'none',
			background: '#0088EE',
			color: '#FFF',
			display: 'inline',
			fontSize: '12px',
		},
	});
	return View({}, [btn]);
};
