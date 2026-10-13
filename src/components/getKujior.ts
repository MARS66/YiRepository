import { Solar } from "lunar-typescript";
import { Lunar } from "lunar-typescript";
import dayjs from "dayjs";
export const KU_JIOR = [
  ["ꐡꃀ", "觉莫"],
  ["ꐡꌺ", "觉惹"],
  ["ꆐꀋꅑ", "能阿低"],
  ["ꆐꀋꅑ", "能阿低"],
  ["ꈐ", "库"],
  ["ꈐꆖ", "库诺"],
  ["ꏃꐣ", "史觉"],
  ["ꏃꆖ", "史诺"],
  ["ꆐꀋꅑ", "能阿低"],
  ["ꆐꀋꅑ", "能阿低"],
];

const YEAR_START_CACHE = new Map<number, Solar>();
const MAX_DAYS_SCAN = 60;

const getYearStart = (lunarYear: number) => {
  const cached = YEAR_START_CACHE.get(lunarYear);
  if (cached) return cached;
  let start = Lunar.fromYmd(lunarYear, 1, 1).getSolar();
  let scanned = 0;
  while (start.getLunar().getDayShengXiao() !== "蛇") {
    if (++scanned > MAX_DAYS_SCAN) {
      throw new Error(`无法在农历 ${lunarYear} 年内定位起始日`);
    }
    start = start.next(1);
  }
  YEAR_START_CACHE.set(lunarYear, start);
  return start;
};

export const getKujior = (date?: string) => {
  const target = dayjs(date);
  const solar = Solar.fromYmd(target.year(), target.month() + 1, target.date());
  let lunarYear = solar.getLunar().getYear();
  let start = getYearStart(lunarYear);
  while (solar.subtract(start) < 0) {
    lunarYear -= 1;
    start = getYearStart(lunarYear);
  }
  const offset = solar.subtract(start);
  const index = ((offset % KU_JIOR.length) + KU_JIOR.length) % KU_JIOR.length;
  return {
    index,
    kujior: KU_JIOR[index],
    start: start.toYmd(),
    offset,
  };
};
