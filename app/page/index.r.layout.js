import { px } from "@zos/utils";
import { BUTTON_TEXT, BUTTON_TEXT_STOP, NORMAL_COLOR, PRESS_COLOR } from "../utils/constants";

export const START_BUTTON = {
  x: px(60),
  y: px(200),
  w: px(360),
  h: px(80),
  text_size: px(36),
  radius: px(12),
  normal_color: NORMAL_COLOR,
  press_color: PRESS_COLOR,
  text: BUTTON_TEXT
};

export const STOP_BUTTON = {
  x: px(60),
  y: px(300),
  w: px(360),
  h: px(80),
  text_size: px(36),
  radius: px(12),
  normal_color: NORMAL_COLOR,
  press_color: PRESS_COLOR,
  text: BUTTON_TEXT_STOP
};

export const HEART_BUTTON = {
  x: px(60),
  y: px(100),
  w: px(160),
  h: px(80),
  text_size: px(36),
  radius: px(12),
  normal_color: 19312082,
  press_color: 10919082,
  text: "love"
};
