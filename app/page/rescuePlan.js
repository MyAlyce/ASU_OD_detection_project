import { BasePage } from '@zeppos/zml/base-page';
import * as appService from '@zos/app-service';
import { queryPermission, requestPermission } from '@zos/app';
import hmUI from '@zos/ui';
import { push } from '@zos/router';
import { getText } from "@zos/i18n";
import * as notificationMgr from "@zos/notification";
import {
    TEXT_WIDGET,
    TEST_NOTIFICATION_BUTTON,
} from 'zosLoader:./rescuePlan.[pf].layout.js';

Page({
    onInit(params) {
        console.log('Rescue Plan page initialized');
    },

    build() {
        // Create text widge
        hmUI.createWidget(hmUI.widget.TEXT, TEXT_WIDGET);

        // Create the button and add click functionality
        hmUI.createWidget(hmUI.widget.BUTTON, {
            // Creates a button widget using the 'BUTTON' type provided by the ZeppOS UI framework.
            ...TEST_NOTIFICATION_BUTTON,  // Spread operator to include predefined properties from TEST_NOTIFICATION_BUTTON (e.g., positioning, size)
        
            click_func: () => {
                console.log('Testing notification button clicked');
                
                // Trigger the notification when the button is clicked
                notificationMgr.notify({
                    title: "TEST",  // The title of the notification displayed in the notification center
                    content: "This is a test notification",  // The body text of the notification
                    actions: [
                        {
                            text: "Ok",  // The text displayed on the notification button (in this case, "Ok")
                            file: "page/rescuePlan",  // Path to the page that should be opened when the "Ok" button is pressed
                            // This file path specifies the App Service file (a specific page or view) that will be launched
                            param: "",  // Optional: Parameters that could be passed along when the page is loaded. In this case, no parameters are provided.
                        },
                    ],
                    vibrate: 6,  // Vibration effect when the notification appears. '6' corresponds to a specific vibration pattern as per the available options:
                    // 0 - default, 1 - beep, 2 - birdsong, 3 - drumbeat, 4 - gentle, 5 - buzz, 6 - custom vibration pattern
                });
            }
        });
    },
            
    onDestroy() {
        console.log('Rescue Plan page destroyed');
    },
});
