import { px } from '@zos/utils';
import { BUTTON_TEXT, NORMAL_COLOR, PRESS_COLOR } from '../utils/constants';

export const TOGGLE_OPTIONS = [
	{
		label: 'Sleep Score',
		key: 'sleepScore',
		x: px(100),
		y: px(80),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Start & End Time',
		key: 'startEndTime',
		x: px(100),
		y: px(130),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Deep Sleep Time',
		key: 'deepSleepTime',
		x: px(100),
		y: px(180),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Total Sleep Time',
		key: 'totalSleepTime',
		x: px(100),
		y: px(230),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Wake Stage',
		key: 'wakeStage',
		x: px(100),
		y: px(280),
		w: px(200),
		h: px(40),
	},
	{
		label: 'REM Stage',
		key: 'remStage',
		x: px(100),
		y: px(330),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Light Stage',
		key: 'lightStage',
		x: px(100),
		y: px(380),
		w: px(200),
		h: px(40),
	},
	{
		label: 'Deep Stage',
		key: 'deepStage',
		x: px(100),
		y: px(430),
		w: px(200),
		h: px(40),
	},
];

export const BACK_BUTTON = {
	x: px(150),
	y: px(325),
	w: px(200),
	h: px(50),
	text_size: px(25),
	radius: px(12),
	normal_color: NORMAL_COLOR,
	press_color: PRESS_COLOR,
	text: 'Go Back',
};