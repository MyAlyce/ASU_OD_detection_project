import { BasePage } from "@zeppos/zml/base-page";
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission } from "@zos/app";
import hmUI from "@zos/ui";
import { createWidget, widget, align, prop, text_style, event } from '@zos/ui'
import { START_BUTTON } from "zosLoader:./index.[pf].layout.js";
import { STOP_BUTTON } from "./index.r.layout";
import { HEART_BUTTON } from "./index.r.layout";
import { HeartRate, Sleep, Time } from "@zos/sensor";
import { log } from "@zos/utils";

const permissions = ["device:os.bg_service"];
const service = "app-service/service";
const storage = getApp()._options.globalData.storage;
const { messageBuilder } = getApp()._options.globalData
const logger = log.getLogger('demo');
let data;


Page(
  BasePage({
    state: {
      temp: null,
      sleepData: null,
    },
    onInit() {
      console.log("page onInit invoked");
      this.request({
        method: "GET_TOKEN"
      }).then(res => {
        hmUI.showToast({
          text: "token: " + res
        })
        storage.setKey("token", res);
      }).catch(err => {
        hmUI.showToast({
          text: "Error getting token on load (not signed in?)"
        });
        console.error("error getting token", err);
      });
      this.onMessage();
    },

    build() {
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...START_BUTTON,
        click_func: () => {
          console.log("fetch button clicked");
          
          const token = storage.getKey("token");
          if (!token) {
            hmUI.showToast({
              text: "Please sign in",
            });
            console.log("No token found, user needs to sign in");
            return;
          }

          // Only proceed if got token
          if (checkPermissions()) {
            startAppService(token);
          } else {
            console.log("permission denied");
          }
        },
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...STOP_BUTTON,
        click_func: () => {
          console.log("stop button clicked");
          appService.stop({
            file: service,
            complete_func: (info) => {
              console.log("service stopped complete_func:", JSON.stringify(info));
              hmUI.showToast({
                text: info.result ? "Service stopped" : "Service failed to stop",
              });
            },
          });
        },
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...HEART_BUTTON,
        click_func: () => {
          console.log("heart button clicked");
          this.state.sleepData = new HeartRate();
          const s_info = `Heartrate ${this.state.sleepData.getLast()}`;
          const text = createWidget(widget.TEXT, {
            x: 240,
            y: 80,
            w: 150,
            h: 106,
            
            color: 0xffffff,
            text_size: 30,
            align_h: align.CENTER_H,
            align_v: align.CENTER_V,
            text_style: text_style.WRAP,
            text: s_info,
          })
          console.log(s_info);
        },
      });
      
      //sends a message to the side service
      messageBuilder.request({
        method:'GET',
        params:{
          index: 0
        }
      }).then(data =>{
        const {result} = data
        logger.log(result)
      })

      //
    },

    onDestroy() {
      console.log("page onDestroy invoked");
    },

    onRequest(req, res) {
      console.log("page onRequest invoked");
      console.log("req:", req);
      console.log("res:", res);
    },

    onCall(req) {
      if (req.method === "SET_TOKEN") {
        console.log("SET_TOKEN method invoked");
        storage.setKey("token", req.params.value);

        hmUI.showToast({
          text: "Token saved " + JSON.stringify(req.params),
        });
        storage.setKey("token", req.params.value);
      }
    },

    onMessage(){
      //side services send a signal here (call)
      messageBuilder.on('call', ({ payload: buf}) =>{
        //converts buffer to json
        data = messageBuilder.buf2Json(buf);
        logger.log('data',data);
      })
    }
  })
);

const startAppService = (token) => {
  console.log("startAppService invoked");
  console.log(`starting service: ${service}`);
  
  appService.start({
    file: service,
    complete_func: (info) => {
      console.log("service started complete_func:", JSON.stringify(info));
      hmUI.showToast({
        text: info.result ? 'Service started' + token : 'Service failed to start',
      });
    },
  });
};

const checkPermissions = () => {
  const [permissionResult] = queryPermission({
    permissions,
  });
  if (permissionResult === 2) {
    console.log("permission previously allowed");
    return true;
  } else {
    requestPermission({
      permissions,
      callback: ([result]) => {
        if (result === 2) {
          console.log("permission granted");
          return true;
        }
      },
    });
  }
  return false;
};

const message = () => {
  this.onMessage();
  return true;
}
