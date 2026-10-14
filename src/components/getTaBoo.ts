import { getYiDate } from "./getDate";
import { ZODIAC } from "../CONSTANT";
// 子赤口
export const TABOO_SON_YI = [
  "ꁭꅐ",
  "ꇐꄸꉻ",
  "ꒈꂪ",
  "ꑾꌋꈤ",
  "ꁮꐚ",
  "ꈌꄸꉻ",
  "ꒈꀑ",
  "ꑛꌋꈤ",
  "ꅉꃴ",
  "ꃅꃴ",
];
export const TABOO_SON_CN = [
  "布都(东)",
  "尔底伙(东南)",
  "日木(南)",
  "约色果(西南)",
  "布吉(西)",
  "克底伙(西北)",
  "日伍(北)",
  "扭色果(东北)",
  "得伍(地上)",
  "莫伍(天上)",
];
//母赤口
export const TABOO_MON_YI = ["ꁭꅐ", "ꒈꂪ", "ꁮꐚ", "ꒈꀑ"];
export const TABOO_MON_CN = ["布都(东)", "日木(南)", "布吉(西)", "日伍(北)"];
//公赤口
export const TABOO_FAT_YI = ["ꑾꌋꈤ", "ꈌꄸꉻ", "ꑛꌋꈤ", "ꇐꄸꉻ"];
export const TABOO_FAT_CN = [
  "约色果(西南)",
  "克底伙(西北)",
  "扭色果(东北)",
  "尔底伙(东南)",
];

export const getYiTaBoo = (date?: string) => {
  const yiDate = getYiDate(date);
  const { year, month, dayIndex } = yiDate;
  const newZodiac = [...ZODIAC.slice(7), ...ZODIAC.slice(0, 7)];
  const monZodiacIndex = newZodiac.indexOf(month[0] as string);
  const yearZodiacIndex = ZODIAC.indexOf(year[0] as string);
  const monIndex = Math.floor(yearZodiacIndex / 3);
  const fatIndex = Math.floor(monZodiacIndex / 3);
  const tabooIndex = dayIndex % 10;
  return {
    ...yiDate,
    tabooMon: [TABOO_MON_YI[monIndex], TABOO_MON_CN[monIndex]],
    tabooFat: [TABOO_FAT_YI[fatIndex], TABOO_FAT_CN[fatIndex]],
    tabooSon: [TABOO_SON_YI[tabooIndex], TABOO_SON_CN[tabooIndex]],
    tabooIndex,
  };
};
