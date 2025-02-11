import { BasePage } from '@zeppos/zml/base-page';
import * as appService from '@zos/app-service';
import { queryPermission, requestPermission } from '@zos/app';
import hmUI from '@zos/ui';
import { push } from '@zos/router';
import { Sleep } from '@zos/sensor'; // Import the Sleep module
import { notify } from '@zos/notification'
import {
	TEXT_WIDGET,
} from 'zosLoader:./rescuePlan.[pf].layout.js';


Page({
    onInit(params) {
        console.log('Rescue Plan page initialized');
    },
    
    build() {
        hmUI.createWidget(hmUI.widget.TEXT, TEXT_WIDGET);  // Use the imported TEXT_WIDGET
    },
    
    onDestroy() {
        console.log('Rescue Plan page destroyed');
    },
});