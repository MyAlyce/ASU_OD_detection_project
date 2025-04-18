import { TAB_COMPONENTS } from './components/TabContent';
import { Tabs } from './components/tabs';
import { createSettingsStore } from './context/SettingsContext';

AppSettingsPage({
	state: {
		props: {},
		googleAuthData: null,
	},
	setState(props) {
		console.log('indexjs: setState', props);
		this.state.props = props;
		try {
			const storedAuthData = JSON.parse(
				props.settingsStorage.getItem('googleAuthData'),
			);
			this.state.googleAuthData = storedAuthData;
		} catch (e) {
			console.error('Error parsing googleAuthData', e);
			console.error(
				'googleAuthData:',
				props.settingsStorage.getItem('googleAuthData'),
			);
		}
		if (this.isTokenExpired() || !this.state.googleAuthData) {
			this.state.googleAuthData = null;
		}

		if (!props.settingsStorage.getItem('activeTab')) {
			props.settingsStorage.setItem('activeTab', 'Settings');
		}
		console.log('indexjs: state:', this.state);
	},
	build(props) {
		this.setState(props);
		const store = createSettingsStore(props);
		const currentTab = store.getState().activeTab || 'Settings';
		const TabComponent = TAB_COMPONENTS[currentTab];
		return Section(
			{
				style: {
					padding: '10px',
				},
			},
			[
				Tabs(),
				View(
					{
						style: {
							display: 'flex',
							flexDirection: 'column',
							gap: '10px',
						},
					},
					TabComponent(),
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
