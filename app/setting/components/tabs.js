import { Tab } from './tab';

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
