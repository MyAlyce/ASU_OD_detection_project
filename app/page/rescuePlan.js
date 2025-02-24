import hmUI from '@zos/ui';
import * as notificationMgr from "@zos/notification";
import { push } from '@zos/router';

import {
    TEXT_WIDGET,
    TEST_NOTIFICATION_BUTTON,
    BACK_BUTTON,
} from 'zosLoader:./rescuePlan.[pf].layout.js';

Page({
    onInit(params) {
        console.log('Rescue Plan page initialized');
    },

    build() {
        // Create text widget
        hmUI.createWidget(hmUI.widget.TEXT, TEXT_WIDGET);

        // Create the test notification button
        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...TEST_NOTIFICATION_BUTTON,  
            click_func: () => {
                console.log('Testing notification button clicked');
                notificationMgr.notify({
                    title: "TEST",
                    content: "This is a test notification",
                    actions: [
                        {
                            text: "Ok",
                            file: "page/rescuePlan",
                            param: "",
                        },
                    ],
                    vibrate: 6,
                });
            }
        });

        // Create the back button
        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...BACK_BUTTON,
            click_func: () => {
                console.log('Back button clicked');
                push({
                    url: 'page/index',
                });
            }
        });
    },

    onDestroy() {
        console.log('Rescue Plan page destroyed');
    },
});
