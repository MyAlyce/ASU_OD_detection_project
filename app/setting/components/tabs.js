const tabs = ['Settings', 'Contacts', 'About'];

/**
 * Create the tabs for the settings page
 * @param {string} activeTab the currently active tab
 * @param {*} setSetting function to set the active tab
 * @returns
 */
export const Tabs = (activeTab, store) => {
	const tabButtons = tabs.map((tabName) => {
		const isActive = tabName === activeTab;
		return Tab(tabName, isActive, () => store.setState('activeTab', tabName));
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
