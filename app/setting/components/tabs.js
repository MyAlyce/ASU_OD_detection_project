const tabs = ['Settings', 'Contacts', 'About'];

export const Tabs = (activeTab, setActiveTab) => {
	const tabButtons = tabs.map((tabName, _index) => {
		const isActive = tabName === activeTab;
		return Tab(tabName, isActive, () => setActiveTab('activeTab', tabName));
	});

	return View(
		{ style: { display: 'flex', flexDirection: 'row', marginBottom: '15px' } },
		tabButtons,
	);
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
