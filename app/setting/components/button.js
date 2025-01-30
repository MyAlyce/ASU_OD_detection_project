export default PrimaryButton = ({ label, onClick }) => {
	return Button({
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
};
