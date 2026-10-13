export const LASE = [
  ["ꃰꇌꑆ", "窝冷基"],
  ["ꆿꐎꀑ", "拉曲哦"],
  ["ꆿꐎꐧ", "拉曲都"],
  ["ꆿꐎꑭ", "拉曲希"],
  ["ꆃꀕꈌ", "逆宁克"],
  ["ꇐꑌꀑ", "尔尼哦"],
  ["ꇐꑌꐧ", "尔尼都"],
  ["ꇐꑌꑭ", "尔尼希"],
];
import { Solar } from "lunar-typescript";
import dayjs from "dayjs";

export const getLaSe = (date?: string) => {
  const solar = Solar.fromYmd(
    dayjs(date).year(),
    dayjs(date).month() + 1,
    dayjs(date).get("date")
  );
  const lunar = solar.getLunar(); // 转换为农历对象
  const dayIndex = lunar.getDay() - 1;
  return LASE[dayIndex % 8];
};
