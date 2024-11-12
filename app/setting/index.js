import { requestGoogleAuthData } from "../app-service/google-api"
import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT_URI } from "../google-api-constants";

AppSettingsPage({
    state: {
        props: {},
        googleAuthData: null,
    },
    setState(props) {
        this.state.props = props;
        const storedAuthData = props.settingsStorage.getItem('googleAuthData');
        if (storedAuthData) {
            this.state.googleAuthData = storedAuthData;
        }
        if (this.isTokenExpired()) {
            this.state.googleAuthData = null;
        }
        console.log('state:', this.state);
    },
    build(props) {
        this.setState(props);
        const signInBtn = Button({
            label: this.state.googleAuthData ? 'Sign Out' : 'Sign In',
            style: {
                fontSize: '12px',
                borderRadius: '30px',
                background: '#D85E33',
                color: 'white'
            },
        })

        const clearBtn = Button({
            label: 'Clear',
            style: {
                fontSize: '12px',
                borderRadius: '30px',
                background: '#D85E33',
                color: 'white'
            },
            onClick: () => {
                console.log('before clear', this.state.props.settingsStorage.toObject());
                this.state.props.settingsStorage.clear();
                this.state.googleAuthData = null;
                console.log('after clear', this.state.props.settingsStorage.toObject());
            }
        })

        const auth = Auth({
            label: signInBtn,
            authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            requestTokenUrl: 'https://oauth2.googleapis.com/token',
            scope: 'https://www.googleapis.com/auth/drive',
            clientId: GOOGLE_API_CLIENT_ID,
            clientSecret: GOOGLE_API_CLIENT_SECRET,
            oAuthParams: {
                redirect_uri: GOOGLE_API_REDIRECT_URI,
                response_type: 'code',
                include_granted_scopes: 'true',
                access_type: 'offline',
                prompt: 'consent'
            },
            onAccessToken: (token) => {
                console.log('onAccessToken', token)
            },
            onReturn: async (authBody) => {
                console.log('onReturn', authBody)
                this.state.props.settingsStorage.setItem('googleAuthCode', authBody.code)
                const authData = await requestGoogleAuthData(authBody)
                authData.requested_at = new Date()
                authData.expires_at = new Date(authData.requested_at.getTime() + authData.expires_in * 1000)
                this.state.props.settingsStorage.setItem('googleAuthData', authData)
                console.log('authData', this.state.googleAuthData)
            },
        })

        return View(
            {
                style: {
                    padding: '12px 20px'
                }
            },
            [
                auth,
                clearBtn
            ]
        )
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
})