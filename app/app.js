import { BaseApp } from "@zeppos/zml/base-app";

import EasyStorage from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

App(
  BaseApp({
    globalData: {
      storage: storage,
    },
    onCreate() {
      console.log("app invoke onCreate");
    },
    onDestroy(opts) {
      console.log("app invoke onDestroy");
    },
  }),
);
