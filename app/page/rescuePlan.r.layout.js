import { px } from '@zos/utils';
import {
	NORMAL_COLOR,
	PRESS_COLOR,
} from '../utils/constants';

export const TEXT_WIDGET = {
    text: 'This is the rescue plan page',
    x: px(50),  // Adjust the position
    y: px(100), // Adjust the position
    w: px(300), // Adjust width
    h: px(50),  // Adjust height
    text_size: px(30), // Adjust text size
    color: 0xFFFFFF, // White color
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