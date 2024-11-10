import { BasePage } from "@zeppos/zml/base-page";
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission } from "@zos/app";
import hmUI from "@zos/ui";
import { START_BUTTON } from "zosLoader:./index.[pf].layout.js";

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
              if (!res || !res.token) {
                hmUI.showToast({
                  text: "Please sign in",
                });
                return;
              }

              this.log("Got token, checking permissions");

              // Only proceed if got token
              if (checkPermissions()) {
                startAppService();
              } else {
                console.log("permission denied");
              }
            })
            .catch((err) => {
              this.log("GET_TOKEN error:", err);
            })
        },
      });
    },

    
    onInit() {
      console.log("page onInit invoked");
    },

    onDestroy() {
      console.log("page onDestroy invoked");
    },
  })
);

const startAppService = () => {
  console.log("startAppService invoked");
  console.log(`starting service: ${service}`);
  storage.setKey("googleAuthData", "test123");
  appService.start({
    url: service,
    params: JSON.stringify({
      googleAuthData: "result from storage", // TODO make this pass in the actual token from above later
    }),
    complete_func: (info) => {
      console.log("service started complete_func:", JSON.stringify(info));
      hmUI.showToast({
        text: `service started: ${JSON.stringify(info)}`,
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
