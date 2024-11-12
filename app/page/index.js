import { BasePage } from "@zeppos/zml/base-page";
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission } from "@zos/app";
import hmUI from "@zos/ui";
import { START_BUTTON } from "zosLoader:./index.[pf].layout.js";
import { STOP_BUTTON } from "./index.r.layout";

const permissions = ["device:os.bg_service"];
const service = "app-service/service";
const storage = getApp()._options.globalData.storage;

Page(
  BasePage({
    state: {},
    build() {
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...START_BUTTON,
        click_func: () => {
          console.log("fetch button clicked");

          // Check token first
          this.request({ method: "GET_TOKEN" })
            .then((res) => {
              console.log("Res:::", JSON.stringify(res));
              if (!res || !res.token) {
                hmUI.showToast({
                  text: "Please sign in",
                });
                console.log("No token found, user needs to sign in");
                return;
              }

              console.log("Got token, checking permissions");
              storage.setKey("token", res.token);

              // Only proceed if got token
              if (checkPermissions()) {
                startAppService(res.token);
              } else {
                console.log("permission denied");
              }
            })
            .catch((err) => {
              this.log("GET_TOKEN error:", err);
            });
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
      },
      )
    },

    onInit() {
      console.log("page onInit invoked");
    },

    onDestroy() {
      console.log("page onDestroy invoked");
    },
  })
);

const startAppService = (token) => {
  console.log("startAppService invoked");
  console.log(`starting service: ${service}`);
  appService.start({
    file: service,
    param: JSON.stringify({ token }),
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
      callback([result]) {
        if (result === 2) {
          console.log("permission granted");
          return true;
        }
      },
    });
  }
  return false;
};
