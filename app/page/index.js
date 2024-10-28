import { BasePage } from '@zeppos/zml/base-page'
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission } from "@zos/app";
import hmUI from '@zos/ui';
import { START_BUTTON } from 'zosLoader:./index.[pf].layout.js';

const permissions = ["device:os.bg_service"];
const service = "app-service/service";

Page(
  BasePage({
    state: {},
    build() {
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...START_BUTTON,
        click_func: () => {
          console.log('fetch button clicked');
          if (checkPermissions()) {
            this.getToken();
            startAppService();
          } else {
            console.log('permission denied');
          }
        }
      })
    },

    onInit() {
      console.log('page onInit invoked')
    },

    onDestroy() {
      console.log('page onDestroy invoked');
    },

    getToken() {
      console.log('getToken invoked');
      this.request({ method: "GET_TOKEN" })
        .then((res) => {
          console.log('GET_TOKEN', JSON.stringify(res));
        }).catch((err) => {
          console.log('GET_TOKEN errored', err);
        });
    }
  }),
)


const startAppService = () => {
  console.log('startAppService invoked');
  console.log(`starting service: ${service}`);
  appService.start({
    url: service,
    complete_func: (info) => {
      console.log('service started complete_func:', JSON.stringify(info));
      hmUI.showToast({
        text: `service started: ${JSON.stringify(info)}`
      });
    }
  })
}

const checkPermissions = () => {
  const [permissionResult] = queryPermission({
    permissions
  });
  if (permissionResult === 2) {
    console.log('permission previously allowed');
    return true;
  } else {
    requestPermission({
      permissions,
      callback([result]) {
        if (result === 2) {
          console.log('permission granted');
          return true;
        }
      }
    });
  }
  return false;
}