import { BaseApp } from '@zeppos/zml/base-app'

//Relevant imports for MessageBuilder
//Files obtained from github repo https://github.com/zepp-health/zeppos-samples/tree/main/application/2.0/todo-list/shared
//Courtesy of fay20fay
import './shared/device-polyfill'
import { MessageBuilder } from './shared/message'
import { getPackageInfo } from '@zos/app'
import * as ble from '@zos/ble'

import EasyStorage from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

App(
  BaseApp({
    globalData: {
      storage: storage,
      messageBuilder: null
    },
    onCreate() {
      console.log('app invoke onCreate')
      //Establish a BT connection
      const { appId } = getPackageInfo();
      const messageBuilder = new MessageBuilder({appId, appDevicePort: 20, appSidePort: 0,ble});
      this.globalData.messageBuilder = messageBuilder;
      messageBuilder.connect();
    },
    onDestroy(opts) {
      console.log('app invoke onDestroy')
      messageBuilder.disConnect();
    },
  }),
)