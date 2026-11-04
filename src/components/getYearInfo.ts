import { Lunar } from "lunar-typescript";
import { XINGXIUM_MAP } from "./get28xingxiu";

/** 十天干 */
export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/** 十二地支 */
export const ZHI = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];
export const YIN_YANG = [
  ["ꀮ", "阳"],
  ["ꃀ", "阴"],
];
export const WU_XING = [
  ["ꌩ", "木"],
  ["ꌩ", "火"],
  ["ꌩ", "土"],
  ["ꌩ", "金"],
  ["ꌩ", "水"],
];
export const JI_SHENG = [
  ["ꃅꃴꌦꌋꐰꇑ", "天神"],
  ["ꅉꃴꌦꌋꐰꇑ", "地祇"],
  ["ꆀꋌꆈꐰꇑ", "鬼"],
  ["ꀉꁌꊂꌒꐰꇑ", "祖神"],
  ["ꁮꀋꏂꇤꃨꐰꇑ", "美女神"],
  ["ꁮꑍꃀꐰꇑ", "蜘蛛"],
  ["ꌩꃴꄮꐎꐰꇑ", "白鸽"],
  ["ꏂꇬꐰꇑ", "蟒蛇"],
  ["ꁐꄮꐰꇑ", "皮特"],
  ["ꑿꉐꐰꇑ", "绵羊"],
];
/** 六十甲子序列，索引 0 即甲子（序号 1） */
export const JIA_ZI_60 = Array.from(
  { length: 60 },
  (_, n) => GAN[n % 10] + ZHI[n % 12]
);

/**
 * 获取纪年干支在六十甲子中的序号（甲子为 0，乙丑为 1，…，癸亥为 59）。
 *
 * @example
 * getGanZhiIndex("1984-05-01"); // 1984 年为甲子年，返回 0
 * getGanZhiIndex("2043-05-01"); // 2043 年为癸亥年，返回 59
 *
 * @param date 阳历日期字符串
 * @returns 0 ~ 59 的序号
 */
export const getGanZhiIndex = (date: string): number => {
  const d = Lunar.fromDate(new Date(date));
  const index = JIA_ZI_60.indexOf(d.getYearInGanZhi());
  return index;
};

export type Result = string[];
/** 值年星宿（岁值星宿）结果 */
export const getSuizhiXing = (date: string): Result => {
  const index = getGanZhiIndex(date) % XINGXIUM_MAP.length;
  return XINGXIUM_MAP[index];
};
/** 阴阳结果 */
export const getYinYang = (date: string): Result => {
  const index = getGanZhiIndex(date) % 2;
  return YIN_YANG[index];
};
/** 五行结果 */
export const getWuXing = (date: string): Result => {
  const index = getGanZhiIndex(date) % 5;
  return WU_XING[index];
};
/** 五行结果 */
export const getJiSheng = (date: string): Result => {
  const index = getGanZhiIndex(date) % 10;
  return JI_SHENG[index];
};
export type YearInfo = {
  /** 值年星宿（岁值星宿） */
  suizhiXing: Result;
  /** 阴阳 */
  yinYang: Result;
  /** 五行 */
  wuXing: Result;
  /** 五行 */
  jiSheng: Result;
};
/** 年信息 */
export const getYearInfo = (date: string): YearInfo => {
  return {
    suizhiXing: getSuizhiXing(date),
    yinYang: getYinYang(date),
    wuXing: getWuXing(date),
    jiSheng: getJiSheng(date),
  };
};
