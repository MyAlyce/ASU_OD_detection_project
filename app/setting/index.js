import { requestAccessToken } from "../app-side/google-api"
import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REDIRECT_URI } from "../google-api-constants";

AppSettingsPage({
    state: {
        props: {},
        googleAuthToken: null,
    },
    setState(props) {
        this.state.props = props
        console.log('props', props)
        if (props.settingsStorage.getItem('googleAuthToken')) {
            this.state.googleAuthToken = JSON.parse(props.settingsStorage.getItem('googleAuthToken'))
        }
    },
    build(props) {
        this.setState(props)
        console.log(props)
        console.log('shi', this.state)
        const signInBtn = Button({
            label: this.state.googleAuthToken ? 'Sign Out' : 'Sign In',
            style: {
                fontSize: '12px',
                borderRadius: '30px',
                background: '#D85E33',
                color: 'white'
            },
        })

        const auth = Auth({
            label: signInBtn,
            authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            requestTokenUrl: 'https://oauth2.googleapis.com/token',
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            clientId: GOOGLE_API_CLIENT_ID,
            clientSecret: GOOGLE_API_CLIENT_SECRET,
            oAuthParams: {
                redirect_uri: GOOGLE_API_REDIRECT_URI,
                response_type: 'code',
                access_type: 'offline',
            },
            onAccessToken: (token) => {
                console.log('onAccessToken', token)
            },
            onReturn: async (authBody) => {
                console.log('onReturn', authBody)
                this.state.props.settingsStorage.setItem('googleAuthCode', authBody.code)
                const token = await requestAccessToken(authBody)
                token.requested_at = new Date()
                token.expires_at = new Date(token.requested_at.getTime() + token.expires_in * 1000)
                this.state.props.settingsStorage.setItem('googleAuthToken', token)

                console.log('token', this.state.googleAuthToken)
            },
        })

        return auth
    }
})