import { px } from "@zos/utils";
import { BUTTON_TEXT, NORMAL_COLOR, PRESS_COLOR } from "../utils/constants";

export const START_BUTTON = {
  x: px(60),
  y: px(300),
  w: px(360),
  h: px(80),
  text_size: px(36),
  radius: px(12),
  normal_color: NORMAL_COLOR,
  press_color: PRESS_COLOR,
  text: BUTTON_TEXT
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
  text: "Sleep Data"
};
