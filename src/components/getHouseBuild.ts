import dayjs from "dayjs";
import { Lunar } from "lunar-typescript";
import { DIRECTION, ZODIAC_CN } from "../CONSTANT";
import { getKujior } from "./getKujior";
import { getXiDe } from "./getXiDe";

/** 生辰五行（按出生年天干推算，含阴阳） */
export type WuXing =
  | "阳木"
  | "阴木"
  | "阳火"
  | "阴火"
  | "阳土"
  | "阴土"
  | "阳金"
  | "阴金"
  | "阳水"
  | "阴水";

/** 吉凶等级：吉 > 平 > 凶 > 忌（忌为绝对禁忌） */
export type HouseBuildLevel = "吉" | "平" | "凶" | "忌";

/** 天干对应五行 */
const GAN_WU_XING: Record<string, WuXing> = {
  甲: "阳木",
  乙: "阴木",
  丙: "阳火",
  丁: "阴火",
  戊: "阳土",
  己: "阴土",
  庚: "阳金",
  辛: "阴金",
  壬: "阳水",
  癸: "阴水",
};

const LEVEL_RANK: Record<HouseBuildLevel, number> = {
  吉: 0,
  平: 1,
  凶: 2,
  忌: 3,
};

// 岁位方位索引，与 CONSTANT 中 DIRECTION / DIRECTION_CN 的顺序一致
const DIR = {
  SOUTH: 0,
  SOUTHWEST: 1,
  WEST: 2,
  NORTHWEST: 3,
  NORTH: 4,
  NORTHEAST: 5,
  EAST: 6,
  SOUTHEAST: 7,
} as const;

// 农历月建与生肖的对应
const ZODIAC_MONTH: Record<string, string> = {
  鼠: "十一月（鼠月）",
  牛: "十二月（牛月）",
  虎: "正月（虎月）",
  兔: "二月（兔月）",
  龙: "三月（龙月）",
  蛇: "四月（蛇月）",
  马: "五月（马月）",
  羊: "六月（羊月）",
  猴: "七月（猴月）",
  鸡: "八月（鸡月）",
  狗: "九月（狗月）",
  猪: "十月（猪月）",
};

// 库纠吉凶：觉莫、觉惹为凶煞之日，忌建房；能阿低为吉；库、库诺、史觉、史诺为凶
const KUJIOR_FORTUNE: Record<string, { level: HouseBuildLevel; note: string }> =
  {
    能阿低: { level: "吉", note: "库纠为能阿低，是吉祥之日，宜修房造屋。" },
    觉莫: { level: "忌", note: "库纠为觉莫，是凶煞之日，忌修房造屋。" },
    觉惹: { level: "忌", note: "库纠为觉惹，是凶煞之日，忌修房造屋。" },
    库: { level: "凶", note: "库纠为库，有不祥之兆，不宜修房造屋。" },
    库诺: { level: "凶", note: "库纠为库诺，有不祥之兆，不宜修房造屋。" },
    史觉: { level: "凶", note: "库纠为史觉，有不祥之兆，不宜修房造屋。" },
    史诺: { level: "凶", note: "库纠为史诺，有不祥之兆，不宜修房造屋。" },
  };

const WOOD: WuXing[] = ["阳木", "阴木"];
const FIRE: WuXing[] = ["阳火", "阴火"];
const WATER: WuXing[] = ["阳水", "阴水"];

interface DirectionReport {
  level: HouseBuildLevel;
  summary: string;
  reasons: string[];
  monthTabooZodiacs: string[];
  dayTabooZodiacs: string[];
  advice: string[];
}

const raiseLevel = (
  target: { level: HouseBuildLevel },
  level: HouseBuildLevel
) => {
  if (LEVEL_RANK[level] > LEVEL_RANK[target.level]) {
    target.level = level;
  }
};

const worstLevel = (a: HouseBuildLevel, b: HouseBuildLevel) =>
  LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;

const monthOf = (zodiac: string) => ZODIAC_MONTH[zodiac];
const dayOf = (zodiac: string) => `${zodiac}日`;

/** 按岁位方位检索修房造屋规则 */
const getDirectionReport = (
  index: number,
  zodiac: string,
  wuXing: WuXing
): DirectionReport => {
  const report: DirectionReport = {
    level: "平",
    summary: "",
    reasons: [],
    monthTabooZodiacs: [],
    dayTabooZodiacs: [],
    advice: [],
  };

  switch (index) {
    // 依母（南）
    case DIR.SOUTH: {
      report.level = "吉";
      report.summary = "岁位在依母（南），修房造屋整体较好。";

      if (zodiac === "鼠" || zodiac === "马") {
        raiseLevel(report, "忌");
        report.reasons.push(
          `属${zodiac}者此年不宜修房造屋，因为依母（南）克鼠、马。`
        );
      }
      if (WATER.includes(wuXing)) {
        raiseLevel(report, "凶");
        report.reasons.push(
          `所对应生辰五行为${wuXing}（水），岁位在依母（南）时修房造屋不太好。`
        );
      }
      report.monthTabooZodiacs.push("鼠", "马");
      report.dayTabooZodiacs.push("鼠", "马");
      report.advice.push("避开鼠月、马月以及鼠日、马日动土建房。");
      break;
    }

    // 约色果（西南）
    case DIR.SOUTHWEST: {
      report.level = "凶";
      report.summary =
        "岁位在约色果（西南），与豹口星座相对应，家中养鸡、养猪成活率不高，不宜修房造屋。";
      report.reasons.push("西南岁位对应豹口星座，直接修建对家畜养殖不利。");
      report.advice.push(
        "如确需修建，开工前先用一只鸡念平安经，再开始修建，可相对好一些。"
      );
      break;
    }

    // 布吉（西）
    case DIR.WEST: {
      report.level = "平";
      report.summary =
        "岁位在布吉（西），太阳沉落之方，家中不易聚财，但不会出现其他害处。";
      report.reasons.push("西方为太阳沉落方向，修房后家中不易聚财。");
      report.monthTabooZodiacs.push("猴", "鸡");
      report.dayTabooZodiacs.push("猴", "鸡");
      report.advice.push(
        "忌在猴月、鸡月修房造屋，更忌在猴日、鸡日修房造屋，因为布吉（西）克猴、鸡。"
      );
      break;
    }

    // 克底伙（西北）
    case DIR.NORTHWEST: {
      report.level = "忌";
      report.summary =
        "岁位在克底伙（西北），与豹口星座相对应，豹会伤主、主会得病，此年绝对不能修房造屋。";
      report.reasons.push("西北岁位对应豹口星座，主伤身患病。");
      break;
    }

    // 依俄／日伍（北）
    case DIR.NORTH: {
      report.level = "平";
      report.summary =
        "岁位在依俄（北），可修房造屋，但须避开相关生肖与五行组合。";

      if (FIRE.includes(wuXing)) {
        raiseLevel(report, "凶");
        report.reasons.push(
          `所对应生辰五行为${wuXing}（火），与北方之水水火不相容，水上不燃火，修房后不会聚财，或有病痛相候。`
        );
      }
      if (zodiac === "猪" || zodiac === "蛇") {
        raiseLevel(report, "忌");
        report.reasons.push(
          `属${zodiac}者此年不能修房造屋，因为依俄（北）克猪、蛇。`
        );
      }
      report.monthTabooZodiacs.push("猪", "蛇");
      report.dayTabooZodiacs.push("猪", "蛇");
      report.advice.push("忌在猪月、蛇月修房造屋，更忌在猪日、蛇日修房造屋。");
      break;
    }

    // 扭色果（东北）
    case DIR.NORTHEAST: {
      report.level = "忌";
      report.summary =
        "岁位在扭色果（东北），修房造屋则病痛不断，且所找钱财会被大火烧尽，此年绝对不能修房造屋。";
      report.reasons.push(
        "东北岁位无论对应何种生辰五行、得到何种吉神保佑，都为绝对禁忌。"
      );
      break;
    }

    // 布都（东）
    case DIR.EAST: {
      report.level = "吉";
      report.summary =
        "岁位在布都（东），太阳升起之方，在日出时开工、日出时落成，为吉祥之象。";
      report.advice.push(
        "选择太阳刚升起时开始修建，并在太阳刚升起时将新房建成，可令太阳欢喜而获吉祥。"
      );

      if (zodiac === "马" && WOOD.includes(wuXing)) {
        raiseLevel(report, "忌");
        report.reasons.push(
          `属马且生辰五行为${wuXing}，东方有白木、白草相克，此年修房会被“阴箭”刺身（病痛）甚至死亡，切忌修建。`
        );
      }
      if (zodiac === "虎" || zodiac === "兔") {
        raiseLevel(report, "忌");
        report.reasons.push(
          `属${zodiac}者此年不能修房造屋，因为布都（东）克虎、兔。`
        );
      }
      report.monthTabooZodiacs.push("虎", "兔");
      report.dayTabooZodiacs.push("虎", "兔");
      report.advice.push("忌在虎月、兔月修房造屋，更忌在虎日、兔日修房造屋。");
      break;
    }

    // 尔底伙（东南）
    case DIR.SOUTHEAST: {
      report.level = "忌";
      report.summary =
        "岁位在尔底伙（东南），与豹口星座相对应，五鬼会跟入屋中要人性命，此年绝对不能修房造屋。";
      report.reasons.push("东南岁位对应豹口星座，五鬼随屋而入，主伤人命。");
      break;
    }

    default: {
      report.level = "忌";
      report.summary = "岁位方位无效，无法推算。";
      report.reasons.push("岁位方位索引超出范围。");
    }
  }

  return report;
};

/**
 * 彝族修房造屋择吉。
 *
 * 综合两层规则：
 * 1. 年份择吉：由女主人目标年的岁位方位，判断该年能否修房造屋，
 *    并给出忌月、忌日与大门朝向禁忌。
 * 2. 日子择吉：按所选日期的库纠（觉莫、觉惹、能阿低、库、库诺、史觉、史诺）
 *    判断吉凶；马日为建房绝对忌讳日，无论库纠如何都不能建房。
 *
 * @param age 女主人今年（当前农历年）的彝族虚岁年龄
 * @param zodiac 女主人属相（中文生肖，如“鼠”）
 * @param date 目标建房的具体日期（如 "2027-03-08"）
 * @param today 参考日期，用于确定“今年”，默认当前时间
 */
export const getHouseBuild = (
  age: number,
  zodiac: string,
  date: string | Date,
  today: string | Date = new Date()
) => {
  if (!Number.isInteger(age) || age <= 0) {
    throw new Error("年龄必须为正整数");
  }
  if (!ZODIAC_CN.includes(zodiac)) {
    throw new Error(`属相无效，应为：${ZODIAC_CN.join("、")}`);
  }

  const now = dayjs(today);
  if (!now.isValid()) {
    throw new Error("参考日期无效");
  }
  const targetDay = dayjs(date);
  if (!targetDay.isValid()) {
    throw new Error("目标建房日期无效");
  }

  const targetDate = targetDay.format("YYYY-MM-DD");
  const targetLunar = Lunar.fromDate(targetDay.toDate());

  // 当前农历年；彝族虚岁在每年农历正月初一增长 1 岁
  const currentLunarYear = Lunar.fromDate(now.toDate()).getYear();
  const targetLunarYear = targetLunar.getYear();
  const targetAge = age + (targetLunarYear - currentLunarYear);
  if (targetAge <= 0) {
    throw new Error("目标建房日期早于出生年份，无法推算岁位");
  }

  // 出生农历年：出生即 1 岁，故 出生年 = 当前农历年 - 年龄 + 1
  const birthLunarYear = currentLunarYear - age + 1;
  const birthLunar = Lunar.fromYmd(birthLunarYear, 1, 1);
  const ganZhi = birthLunar.getYearInGanZhi();
  const birthZodiac = birthLunar.getYearShengXiao();
  const wuXing = GAN_WU_XING[ganZhi[0]];

  if (!wuXing) {
    throw new Error(`无法由出生年干支 ${ganZhi} 推算生辰五行`);
  }

  // 年份择吉：目标年女主人岁位
  const [directionYi, directionCn] = getXiDe(targetAge, true);
  const directionIndex = DIRECTION.indexOf(directionYi);
  const yearReport = getDirectionReport(directionIndex, zodiac, wuXing);

  // 日子择吉：库纠 + 农历月日生肖
  const kujior = getKujior(targetDate);
  const kujiorCn = kujior.kujior[1];
  const fortune = KUJIOR_FORTUNE[kujiorCn];
  const lunarMonth = Math.abs(targetLunar.getMonth());
  const monthZodiac = ZODIAC_CN[(lunarMonth + 1) % 12];
  const dayZodiac = targetLunar.getDayShengXiao();
  const isHorseDay = dayZodiac === "马";

  const day = {
    level: fortune?.level ?? ("凶" as HouseBuildLevel),
    summary: fortune?.note ?? `库纠为${kujiorCn}，吉凶未知，不宜修房造屋。`,
    reasons: [] as string[],
  };

  if (isHorseDay) {
    raiseLevel(day, "忌");
    day.reasons.push(
      "当日为马日，马日为建房忌讳日（马日不建房），无论库纠吉凶都不能建房。"
    );
  }
  if (yearReport.monthTabooZodiacs.includes(monthZodiac)) {
    raiseLevel(day, "忌");
    day.reasons.push(
      `所选日期在${monthOf(monthZodiac)}，岁位${directionCn}时该月忌修房造屋。`
    );
  }
  if (yearReport.dayTabooZodiacs.includes(dayZodiac) && dayZodiac !== "马") {
    raiseLevel(day, "忌");
    day.reasons.push(
      `当日为${dayOf(dayZodiac)}，岁位${directionCn}时忌在${dayOf(dayZodiac)}修房造屋。`
    );
  }

  // 综合结论：年份与日期都通过才可动土
  const level = worstLevel(yearReport.level, day.level);

  const reasons = new Set<string>();
  if (birthZodiac !== zodiac) {
    reasons.add(
      `注意：按年龄推算出生年为 ${birthLunarYear} 年（${ganZhi}，属${birthZodiac}），与输入属相“${zodiac}”不一致，生辰五行仍按 ${ganZhi} 年推算。`
    );
  }
  reasons.add(yearReport.summary);
  yearReport.reasons.forEach((reason) => reasons.add(reason));
  reasons.add(day.summary);
  day.reasons.forEach((reason) => reasons.add(reason));

  return {
    level,
    reasons: [...reasons],
  };
};
