import { BaseSideService } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log('app side service invoke onInit');
    },

    onRun() { },

    onDestroy() { },

    async onRequest(req, res) {
      console.log(`Method ==> ${req.method}`)
      if (req.method === "POST_TO_GOOGLE") {
        console.log('req.body', req.body)
        // const accessToken = settings.settingsStorage.getItem('googleAuthData').access_token;
        // const response = await sendDataToGoogleSheets(accessToken, req.body);
        // if (response.success) {
        //   console.log('Successfully wrote to Google Sheets');
        //   res(null, { status: 'success' });
        // } else {
        //   console.error('Failed to write to Google Sheets');
        //   res(null, { status: 'error', data: response.data });
        // }
      } else if (req.method === "GET_TOKEN") {
        //settings.settingsStorage.getItem('googleAuthData')?.access_token
        res(null, { token: settings.settingsStorage.getItem('googleAuthData')?.access_token });
      }
    }
  }),
)
