import { DIRECTION, DIRECTION_CN, ZODIAC_CN } from "../CONSTANT";
import { Lunar } from "lunar-typescript";
export const getXiDe = (age: number, iswoman: boolean = false) => {
  // 1 岁起宫：正向从索引 0 开始顺循环，逆向从索引 4 开始逆循环
  const index = iswoman ? (((5 - age) % 8) + 8) % 8 : (age - 1) % 8;
  return [DIRECTION[index], DIRECTION_CN[index]];
};
/**
 * 彝族虚岁：出生即 1 岁，每年农历正月初一涨 1 岁。
 * 输入中文生肖，返回今年（当前农历年）该生肖在 100 岁以内的所有虚岁年龄。
 */
export const getYiAge = (zodiac: string) => {
  const thisYearIndex = ZODIAC_CN.indexOf(
    Lunar.fromDate(new Date()).getYearShengXiao()
  );
  const targetIndex = ZODIAC_CN.indexOf(zodiac);
  if (thisYearIndex === -1 || targetIndex === -1) return [];

  const ages: number[] = [];
  // 该生肖离今年最近的年差（0~11），虚岁 = 年差 + 1，之后每 12 年一轮
  for (
    let gap = (thisYearIndex - targetIndex + 12) % 12;
    gap + 1 <= 100;
    gap += 12
  ) {
    ages.push(gap + 1);
  }
  return ages;
};
