import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {},
    onCreate() {
      console.log('app invoke onCreate')
    },
    onDestroy(opts) {
      console.log('app invoke onDestroy')
    },
  }),
)