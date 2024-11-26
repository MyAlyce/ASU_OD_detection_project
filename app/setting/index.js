import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT_URI } from "../google-api-constants";

AppSettingsPage({
    state: {
        props: {},
        googleAuthData: null,
    },
    setState(props) {
        console.log('setState', props);
        this.state.props = props;
        const storedAuthData = JSON.parse(props.settingsStorage.getItem('googleAuthData'));
        if (storedAuthData) {
            this.state.googleAuthData = storedAuthData;
        }
        if (this.isTokenExpired() || !this.state.googleAuthData) {
            this.state.googleAuthData = null;
        }
        console.log('state:', this.state);
    },
    build(props) {
        this.setState(props);

        const nowTag = (new Date()).toISOString().substring(0, 19);
        if (props.settingsStorage.getItem("now") !== nowTag) props.settingsStorage.setItem("now", nowTag);

        const signInBtn = Button({
            label: this.state.googleAuthData ? 'Sign Out' : 'Sign In', // fix
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
                // this.state.props.settingsStorage.clear();
                props.settingsStorage.setItem("googleAuthData", null);
                props.settingsStorage.setItem("googleAuthCode", null);
                this.state.googleAuthData = "";
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
                console.log('onReturn', authBody);
                // Use requestGoogleAuthData directly
                const authData = await requestGoogleAuthData(authBody);
                authData.requested_at = new Date();
                authData.expires_at = new Date(authData.requested_at.getTime() + authData.expires_in * 1000);
                this.state.props.settingsStorage.setItem('googleAuthData', JSON.stringify(authData));
                console.log('authData', this.state.googleAuthData);
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

/**
 * Request Google Auth Data from Google API after receiving auth code 
 * @param authResponse the auth code from Google API
 * @returns access token and other data for using API
*/
const requestGoogleAuthData = async (authResponse) => {
    const params = {
        grant_type: 'authorization_code',
        client_id: GOOGLE_API_CLIENT_ID,
        client_secret: GOOGLE_API_CLIENT_SECRET,
        redirect_uri: GOOGLE_API_REDIRECT_URI,
        code: authResponse.code
    };

    const body = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    const data = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    });
    return await data.json();
}
