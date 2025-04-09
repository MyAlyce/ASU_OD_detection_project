import { px } from '@zos/utils';

import {
	BUTTON_TEXT,
	BUTTON_TEXT_STOP,
	NORMAL_COLOR,
	PRESS_COLOR,
} from '../utils/constants';

export const START_BUTTON = {
	x: px(60),
	y: px(300),
	w: px(360),
	h: px(80),
	text_size: px(36),
	radius: px(12),
	normal_color: NORMAL_COLOR,
	press_color: PRESS_COLOR,
	text: BUTTON_TEXT,
};

export const STOP_BUTTON = {
	x: px(260),
	y: px(150),
	w: px(200),
	h: px(60),
	text_size: px(30),
	radius: px(12),
	normal_color: NORMAL_COLOR,
	press_color: PRESS_COLOR,
	text: BUTTON_TEXT_STOP,
};

export const SLEEP_BUTTON = {
	x: px(50),
	y: px(225),
	w: px(200),
	h: px(50),
	text_size: px(25),
	radius: px(12),
	normal_color: 0xaa42ee,
	press_color: 0xb964f0,
	text: 'Data',
};

export const PERMISSIONS_BUTTON = {
	x: px(75),
	y: px(100),
	w: px(225),
	h: px(50),
	text_size: px(25),
	radius: px(12),
	normal_color: 0x0352fc,
	press_color: 0x487ff7,
	text: 'Permission Data',
};

export const RESUCE_PLAN_BUTTON = {
	x: px(260),
	y: px(225),
	w: px(225),
	h: px(50),
	text_size: px(25),
	radius: px(12),
	normal_color: 0x0352fc,
	press_color: 0x487ff7,
	text: 'Resuce Plan',
};
