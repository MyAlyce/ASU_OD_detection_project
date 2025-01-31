import { TAB_COMPONENTS } from './components/TabContent';
import { Tabs } from './components/tabs';
import { createSettingsStore } from './context/SettingsContext';

AppSettingsPage({
	state: {
		props: {},
		googleAuthData: null,
	},
	setState(props) {
		console.log('setState', props);
		this.state.props = props;
		const storedAuthData = JSON.parse(
			props.settingsStorage.getItem('googleAuthData'),
		);
		this.state.googleAuthData = storedAuthData || null;

		if (this.isTokenExpired() || !this.state.googleAuthData) {
			this.state.googleAuthData = null;
		}

		if (!props.settingsStorage.getItem('activeTab')) {
			props.settingsStorage.setItem('activeTab', 'Settings');
		}
		console.log('state:', this.state);
	},
	build(props) {
		this.setState(props);
		const store = createSettingsStore(props.settings, props.settingsStorage);
		const currentTab = store.getState().activeTab;
		const TabComponent = TAB_COMPONENTS[currentTab];
		console.log('Showing tab:', currentTab);
		return Section(
			{
				style: {
					padding: '10px',
				},
			},
			[
				Tabs(currentTab, store),
				View(
					{
						style: {
							display: 'flex',
							flexDirection: 'column',
							gap: '10px',
						},
					},
					TabComponent(store),
				),
			],
		);
	},

	isTokenExpired() {
		const authData = this.state.googleAuthData;
		if (!authData || !authData.expires_at) {
			return true;
		}
		const now = new Date();
		const expiresAt = new Date(authData.expires_at);
		return now >= expiresAt;
	},
});
