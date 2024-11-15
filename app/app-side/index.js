import { BaseSideService, settingsLib } from "@zeppos/zml/base-side";
import { MessageBuilder } from '../shared/message-side';
//import { HeartRate, Sleep } from "@zos/sensor";

const messageBuilder = new MessageBuilder();

AppSideService(
  BaseSideService({
    onInit() {
      console.log('app side service invoke onInit');
      messageBuilder.listen(() => {});

      //send message to the device app
      messageBuilder.call({text:'Hello Zepp'});

      //and receive message
      messageBuilder.on('request', (ctx) => {
        const payload = messageBuilder.buf2Json(ctx.request.payload);
        const { method, params } = payload;

        if(method === 'GET'){
          ctx.response({
            data: {result : 0}
          })
        }
      })
    },

    onRun() { },

    onDestroy() { },

    onRequest(req, res) {
      console.log(`Method ==> ${req.method}`)
      if (req.method === "POST_TO_GOOGLE") {
        console.log('req.body', req.body)
      } else if (req.method === "GET_TOKEN") {
        const token = settingsLib.getItem('googleAuthData') ? JSON.parse(settingsLib.getItem('googleAuthData')).access_token : undefined;
        if (token) {
          res(null, token);
        } else {
          res("No token found");
        }
      }
    },
    onSettingsChange({ key, newValue, oldValue }) {
      console.log('onSettingsChange', key, newValue, oldValue);
      console.log(settingsLib.getAll());
      if (key === 'googleAuthData') {
        console.log('googleAuthData changed');
        this.call({
          method: "SET_TOKEN",
          params: {
            key: 'googleAuthData',
            value: JSON.parse(newValue).access_token
          }
        })
      }
    },
  }),
)
