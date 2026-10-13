import { Solar } from "lunar-typescript";
import {
  ZODIAC_TO_YI,
  ZODIAC,
  ZODIAC_TO_CN,
  MONTH_DARK,
  MONTH_DARK_CN,
} from "../CONSTANT";
import dayjs from "dayjs";
// 获取年份生肖，返回 [彝族生肖, 中文生肖]
export const getYiDate = (date?: string, startIndex: number = 7) => {
  const d = dayjs(date);
  if (!d.isValid()) throw new Error(`Invalid date: ${date} `);
  const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
  const lunar = solar.getLunar(); // 转换为农历对象
  const monthIndex = Math.abs(lunar.getMonth()) - 1;
  const dayIndex = lunar.getDay() - 1;
  const newZodiac = [
    ...ZODIAC.slice(startIndex),
    ...ZODIAC.slice(0, startIndex),
  ];
  return {
    year: [
      ZODIAC_TO_YI.get(lunar.getYearShengXiao()),
      lunar.getYearShengXiao(),
    ],
    month: [newZodiac[monthIndex], ZODIAC_TO_CN.get(newZodiac[monthIndex])],
    day: [ZODIAC_TO_YI.get(lunar.getDayShengXiao()), lunar.getDayShengXiao()],
    dayMoon: [MONTH_DARK[dayIndex], MONTH_DARK_CN[dayIndex]],
    dayIndex,
    monthIndex,
  };
};
