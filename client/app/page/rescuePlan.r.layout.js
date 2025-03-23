import { px } from '@zos/utils';
import {
    NORMAL_COLOR,
    PRESS_COLOR,
} from '../utils/constants';

export const TEXT_WIDGET = {
    text: 'This is the rescue plan page',
    x: px(50),  
    y: px(100), 
    w: px(300), 
    h: px(50),  
    text_size: px(30), 
    color: 0xFFFFFF, 
};

export const TEST_NOTIFICATION_BUTTON = {
    x: px(60),
    y: px(300),
    w: px(360),
    h: px(80),
    text_size: px(36),
    radius: px(12),
    normal_color: NORMAL_COLOR,
    press_color: PRESS_COLOR,
    text: "Test Notif",
};

// Updated Back Button Position
export const BACK_BUTTON = {
    x: px(10),
    y: px(400), 
    w: px(100),
    h: px(50),
    text_size: px(36),
    radius: px(12),
    normal_color: NORMAL_COLOR,
    press_color: PRESS_COLOR,
    text: "Back",
};

// Enable Rescue Plan Button
export const ENABLE_PLAN_BUTTON = {
    x: px(150),
    y: px(200),  
    w: px(250),  
    h: px(60),   
    text_size: px(36),
    radius: px(12),
    normal_color: NORMAL_COLOR,
    press_color: PRESS_COLOR,
    text: "Enable Rescue Plan",  
};
