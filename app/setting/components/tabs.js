const tabs = ['Settings', 'Contacts', 'About'];

export const Tabs = (activeTab, setSetting) => {
	const tabButtons = tabs.map((tabName) => {
		const isActive = tabName === activeTab;
		return Tab(tabName, isActive, () => setSetting('activeTab', tabName));
	});

	return View({ style: { display: 'flex', marginBottom: '15px' } }, tabButtons);
};

const Tab = (label, isActive, onClick) => {
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
