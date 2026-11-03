import dayjs from "dayjs";
import {
  getMoonAlcyoneConjunction,
  type MoonAlcyoneConjunctionResult,
} from "./getMoonAlcyoneConjunction";

export const XINGXIUM_MAP = [
  ["ꄡꀧ", "塔波"],
  ["ꆫꐩ", "尔都"],
  ["ꐯꀑ", "基哦"],
  ["ꐯꇇ", "基罗"],
  ["ꐯꐧ", "基都"],
  ["ꐯꂪ", "基姆"],
  ["ꃰꆖ", "窝诺"],
  ["ꃰꉈ", "窝黑"],
  ["ꃰꌦꄙ", "窝斯都"],
  ["ꃰꌦꂷ", "窝斯玛"],
  ["ꃰꅐꂪꎵ", "窝都木朔"],
  ["ꍔꋆ", "折曲"],
  ["ꍔꁧ", "折波"],
  ["ꍀꉻ", "日霍"],
  ["ꍀꑓ", "日纽"],
  ["ꍀꈌ", "日可"],
  ["ꍀꐧ", "日都"],
  ["ꍀꉌ", "日黑"],
  ["ꍀꂪ", "日姆"],
  ["ꍀꅐꌐꁠ", "日都三巴"],
  ["ꀨꀮ", "薄布"],
  ["ꇁꈴ", "冷嘎"],
  ["ꌋꄙ", "色都"],
  ["ꌋꂷ", "色玛"],
  ["ꌋꄚ", "色剃"],
  ["ꃅꑳ", "木海"],
  ["ꆪꈌ", "勒克"],
  ["ꄡꂫ", "塔姆"],
];

/** 星宿月天数依次循环：27、27、28（平均 27.33 ≈ 恒星月 27.32 天） */
const MONTH_LENGTHS = [27, 27, 28] as const;
/** 27 天星宿月被跳过的星宿索引（折曲） */
const SKIP_INDEX = 11;

export interface XingxiuResult {
  /** 输入日期 */
  date: string;
  /** 星宿索引（0-27，对应 XINGXIUM_MAP） */
  index: number;
  /** 彝文星宿名 */
  yi: string;
  /** 中文星宿名 */
  cn: string;
  /** 距锚定点（坦博日）的天数，负值表示锚点之前 */
  dayIndex: number;
  /** 第几个星宿月（锚点所在月为 0，锚点之前为负） */
  monthIndex: number;
  /** 星宿月内第几天 */
  dayInMonth: number;
  /** 当月天数（27 或 28） */
  monthDays: number;
  /** 坦博日（当年月亮与昴宿相合锚定点）详情 */
  anchor: MoonAlcyoneConjunctionResult;
}

/**
 * 获取输入日期对应的二十八星宿。
 *
 * 规则：以当年月亮与昴宿六相合的锚定点（阳历日期）为坦博日（索引 0），
 * 之后按 27、27、28 天的星宿月循环推进；27 天月跳过索引 11 的折曲，
 * 28 天月正常包含全部 28 宿。锚点之前的日期从锚点反推（负向计数），
 * 星宿月序列向锚点之前延伸为 …28、27、27、锚点月 27、28、27、27…。
 *
 * @param date 阳历日期（YYYY-MM-DD），默认今天
 */
export function getXingxiu(date?: string): XingxiuResult {
  const d = dayjs(date);
  if (!d.isValid()) throw new Error(`Invalid date: ${date}`);
  const year = d.year();

  // 当年的月亮与昴宿相合锚定点（坦博日）
  const anchor = getMoonAlcyoneConjunction(year);
  const anchorDate = dayjs(anchor.date);

  const dayIndex = d.startOf("day").diff(anchorDate.startOf("day"), "day");

  // 定位第几个星宿月及月内第几天（支持锚点之前负向反推）
  let remaining = dayIndex;
  let monthIndex = 0;
  const monthLen = (k: number) =>
    MONTH_LENGTHS[
      ((k % MONTH_LENGTHS.length) + MONTH_LENGTHS.length) % MONTH_LENGTHS.length
    ];
  if (dayIndex >= 0) {
    while (remaining >= monthLen(monthIndex)) {
      remaining -= monthLen(monthIndex);
      monthIndex++;
    }
  } else {
    while (remaining < 0) {
      monthIndex--;
      remaining += monthLen(monthIndex);
    }
  }
  const monthDays = monthLen(monthIndex);
  const dayInMonth = remaining;

  // 27 天星宿月跳过折曲（索引 11），28 天正常获取
  const index =
    monthDays === 27 && dayInMonth >= SKIP_INDEX ? dayInMonth + 1 : dayInMonth;
  const xingxiu = XINGXIUM_MAP[index];

  return {
    date: d.format("YYYY-MM-DD"),
    index,
    yi: xingxiu[0],
    cn: xingxiu[1],
    dayIndex,
    monthIndex,
    dayInMonth,
    monthDays,
    anchor,
  };
}
