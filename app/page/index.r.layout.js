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

export const STOP_BUTTON = {
  x: px(250),
  y: px(100),
  w: px(160),
  h: px(80),
  text_size: px(20),
  radius: px(12),
  normal_color: 18001003,
  press_color: 18001113,
  text: "SLEEP"
}
