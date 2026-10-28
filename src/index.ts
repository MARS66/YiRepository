/**
 * YiLunar —— npm 库脚手架示例入口
 * 在此处导出你的库 API，供外部 `import { ... } from "yi-lunar"` 使用。
 */
import { getYiDate } from "./components/getDate";
import { getYiTaBoo } from "./components/getTaBoo";
import { getLaSe } from "./components/getLaSe";
import { getKujior } from "./components/getKujior";
import { getZeTa } from "./components/getZeTa";
import { getTodayFortune } from "./components/getTodayFortune";
import { Solar, Lunar } from "lunar-typescript";
/** 库版本号 */
export const VERSION = "0.1.0";
export {
  Solar,
  Lunar,
  getYiDate,
  getYiTaBoo,
  getLaSe,
  getKujior,
  getZeTa,
  getTodayFortune,
};
