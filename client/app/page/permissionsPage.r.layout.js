import { px } from '@zos/utils';
import { BUTTON_TEXT, NORMAL_COLOR, PRESS_COLOR } from '../utils/constants';
import hmUI, { createWidget, widget, align, text_style, prop } from '@zos/ui';

/*export const createToggleSwitch = (option, checkedValue, handleToggleChange) => ({
	x: px(option.x + 100), // Position the toggle switch slightly to the right
	y: px(option.y),
	w: px(option.w),
	h: px(option.h),
	checked: px(checkedValue),
	color: 0xffffff, // Text color for better visibility
	text_size: px(16), // Smaller text size
});*/

// Function to create a label for a toggle switch
export const createToggleLabel = (option) => ({
	text: option.label,
	x: px(option.x), // Position the label next to the toggle
	y: px(option.y + 5), // Adjust the Y position slightly to match the center of the toggle
	w: px(100), // Adjust the width for the label
	h: px(option.h), // Keep the same height as the toggle
	text_size: px(16), // Smaller text size for the label
	color: 0xffffff, // Text color for better visibility
	align_h: hmUI.align.LEFT, // Align the text to the left
});

export const titleText = createWidget(widget.TEXT, {
	text: 'Permissions Page',
	x: px(100),
	y: px(20),
	w: px(200),
	h: px(50),
	text_size: px(24),
	color: 0xffffff,
	align_h: hmUI.align.CENTER_H,
	text_style: hmUI.text_style.WRAP,
});

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
	{
		label: 'Heart Rate',
		key: 'heartRate',
		x: px(100),
		y: px(480),
		w: px(200),
		h: px(40),
	},
];

export const BACK_BUTTON = {
	x: px(150),
	y: px(540),
	w: px(200),
	h: px(50),
	text_size: px(25),
	radius: px(12),
	normal_color: NORMAL_COLOR,
	press_color: PRESS_COLOR,
	text: 'Go Back',
};


