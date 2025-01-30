import Tab from './tab';

const tabs = ['Settings', 'Contacts', 'About'];

export default Tabs = (activeTab) => {
	const tabButtons = tabs.map((tabName, _index) => {
		const isActive = tabName === activeTab;
		return Tab(tabName, isActive);
	});

	return View(
		{ style: { display: 'flex', flexDirection: 'row', marginBottom: '15px' } },
		tabButtons,
	);
};
