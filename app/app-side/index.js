import { BaseSideService } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log('app side service invoke onInit')
      // settings.settingsStorage.addListener('change', ({ k, newVal, oldVal }) => {
      //   console.log('settings change', k, newVal, oldVal)
      // });
      // console.log('settings token', settings.settingsStorage.getItem('googleAuthToken'))
    },

    onRun() { },

    onDestroy() { },

    onRequest(req, res) {
      console.log(`Method ==> ${req.method}`)
      if (req.method === "POST_TO_GOOGLE") {
        console.log('req.body', req.body)
      } else if (req.method === "GET_TOKEN") {
        res(null, { token: settings.settingsStorage.getItem('googleAuthToken') })
      }
    }
  }),
)
