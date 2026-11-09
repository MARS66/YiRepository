import { Lunar } from "lunar-typescript";
import dayjs from "dayjs";

/** 十二时辰对应时间段（每 2 小时一个时辰，子时从 23:00 开始） */
export const SHI_CHEN_TIME = [
  ["子时", "23:00-00:59"],
  ["丑时", "01:00-02:59"],
  ["寅时", "03:00-04:59"],
  ["卯时", "05:00-06:59"],
  ["辰时", "07:00-08:59"],
  ["巳时", "09:00-10:59"],
  ["午时", "11:00-12:59"],
  ["未时", "13:00-14:59"],
  ["申时", "15:00-16:59"],
  ["酉时", "17:00-18:59"],
  ["戌时", "19:00-20:59"],
  ["亥时", "21:00-22:59"],
];
export const SHI_CHEN_YI = [
  ["ꌋꁁꉌꄮ", "夜半鼠时"],
  ["ꌋꈯꑛꄮ", "反刍牛时"],
  ["ꃬꂇꆿꄮ", "鸡鸣虎时"],
  ["ꄜꐛꄯꆪꄮ", "黎明兔时"],
  ["ꈧꅐꇐꄮ", "日出龙时"],
  ["ꁮꈤꏂꄮ", "放牧蛇时"],
  ["ꂸꆫꃅꄮ", "日中马时"],
  ["ꐯꋒꑿꄮ", "日晷羊时"],
  ["ꈨꃹꑙꄮ", "日落猴时"],
  ["ꃅꃤꑷꄮ", "黄昏鸡时"],
  ["ꊿꀀꈌꄮ", "入睡狗时"],
  ["ꌋꐔꃮꄮ", "人静猪时"],
];
export type ShiChenInfo = {
  yi: string[];
  cn: string;
};

/**
 * 获取具体时间对应的农历时辰（十二时辰）。
 *
 * @example
 * getShiChen("2026-11-09 12:00"); // 午时
 * getShiChen("2026-11-09 23:30"); // 子时（23:00 起算）
 *
 * @param date 具体日期时间字符串
 * @returns 时辰信息
 */
export const getShiChen = (date?: string): ShiChenInfo => {
  const d = dayjs(date);
  if (!d.isValid()) throw new Error(`Invalid date: ${date}`);
  const lunar = Lunar.fromDate(d.toDate());
  const zhi = lunar.getTimeZhi();
  const index = SHI_CHEN_TIME.findIndex(([name]) => name === `${zhi}时`);
  return {
    cn: `${zhi}时`,
    yi: SHI_CHEN_YI[index],
  };
};
