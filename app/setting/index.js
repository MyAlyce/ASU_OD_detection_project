import { TAB_COMPONENTS } from './components/TabContent';
import { Tabs } from './components/tabs';
import { createSettingsStore } from './context/SettingsContext';
import {
	createAuthView,
	createShareEmailInput,
	createSignOutButton,
} from './util/createViews';

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
		if (storedAuthData) {
			this.state.googleAuthData = storedAuthData;
		}
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
		const store = createSettingsStore(props.settingsStorage);

		const currentTab = store.getSetting('activeTab') || 'Settings';
		const isUserSignedIn = !!this.state.googleAuthData;

		store.setState({
			isUserSignedIn,
			authView: createAuthView(store),
			shareEmailInput: createShareEmailInput(store),
			signOutBtn: createSignOutButton(store),
		});

		const TabComponent = TAB_COMPONENTS[currentTab];

		return Section(
			{
				style: {
					padding: '10px',
				},
			},
			[
				Tabs(currentTab, store.setSetting),
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
