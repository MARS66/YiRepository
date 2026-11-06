declare const getXiDe: (age: number, iswoman?: boolean) => string[];
/**
 * 彝族虚岁：出生即 1 岁，每年农历正月初一涨 1 岁。
 * 输入中文生肖，返回今年（当前农历年）该生肖在 100 岁以内的所有虚岁年龄。
 */
declare const getYiAge: (zodiac: string) => number[];

declare const getYiDate: (date?: string, startIndex?: number) => {
    year: (string | undefined)[];
    month: (string | undefined)[];
    day: (string | undefined)[];
    dayMoon: string[];
    dayIndex: number;
    monthIndex: number;
    dayZodiacIndex: number;
    monthZodiacIndex: number;
    yearZodiacIndex: number;
};

declare const getYiTaBoo: (date?: string, startIndex?: number) => {
    tabooMon: string[];
    tabooFat: string[];
    tabooSon: string[];
    tabooIndex: number;
    year: (string | undefined)[];
    month: (string | undefined)[];
    day: (string | undefined)[];
    dayMoon: string[];
    dayIndex: number;
    monthIndex: number;
    dayZodiacIndex: number;
    monthZodiacIndex: number;
    yearZodiacIndex: number;
};

declare const LASE: string[][];
declare const getLaSe: (date?: string) => string[];

declare const KU_JIOR: string[][];
declare const getKujior: (date?: string) => {
    index: number;
    kujior: string[];
    start: string;
    offset: number;
};

declare const ZENG_TA: string[][][];
declare function getZeTa(date: string): string[] | undefined;

declare function getTodayFortune(index: number): {
    taboo: string[];
    tabooFull: string;
};

/** 生辰五行（按出生年天干推算，含阴阳） */
type WuXing = "阳木" | "阴木" | "阳火" | "阴火" | "阳土" | "阴土" | "阳金" | "阴金" | "阳水" | "阴水";
/** 吉凶等级：吉 > 平 > 凶 > 忌（忌为绝对禁忌） */
type HouseBuildLevel = "吉" | "平" | "凶" | "忌";
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
declare const getHouseBuild: (age: number, zodiac: string, date: string | Date, today?: string | Date) => {
    level: HouseBuildLevel;
    reasons: string[];
};

/** 十天干 */
declare const GAN: string[];
/** 十二地支 */
declare const ZHI: string[];
declare const YIN_YANG: string[][];
declare const WU_XING: string[][];
declare const JI_SHENG: string[][];
/** 六十甲子序列，索引 0 即甲子（序号 1） */
declare const JIA_ZI_60: string[];
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
declare const getGanZhiIndex: (date: string) => number;
type Result = string[];
/** 值年星宿（岁值星宿）结果 */
declare const getSuizhiXing: (date: string) => Result;
/** 阴阳结果 */
declare const getYinYang: (date: string) => Result;
/** 五行结果 */
declare const getWuXing: (date: string) => Result;
/** 五行结果 */
declare const getJiSheng: (date: string) => Result;
type YearInfo = {
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
declare const getYearInfo: (date: string) => YearInfo;

interface MoonAlcyoneConjunctionOptions {
    /** 搜索窗口的半宽（天），默认 7 */
    windowDays?: number;
    /** 粗扫步长（小时），默认 1 */
    stepHours?: number;
    /** 自动扩展窗口的最大半宽（天），默认 30 */
    maxWindowDays?: number;
}
interface MoonAlcyoneConjunctionResult {
    /** 输入年份 */
    year: number;
    /** 相合时刻的阳历日期（北京时间 YYYY-MM-DD） */
    date: string;
    /** 相合时刻（北京时间 HH:mm） */
    beijingTime: string;
    /** 相合时刻（世界时） */
    utc: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        second: number;
    };
    /** 相合时刻的儒略日（UT） */
    julianDay: number;
    /** 相合时月亮与昴宿六的黄经差（度）；精确穿越时为 0 */
    longitudeDiff: number;
    /** 该年农历七月初七对应的阳历日期 */
    qixiDate: string;
    /** 最终使用的搜索半窗口天数（可能因自动扩展而大于 windowDays） */
    windowDays: number;
}
/**
 * 计算指定年份七夕前后月亮与昴宿六相合的阳历日期。
 * @param year 年份，默认今年
 */
declare function getMoonAlcyoneConjunction(year?: number, options?: MoonAlcyoneConjunctionOptions): MoonAlcyoneConjunctionResult;

declare const XINGXIUM_MAP: string[][];
interface XingxiuResult {
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
declare function getXingxiu(date?: string): XingxiuResult;

declare const ZODIAC: string[];
declare const ZODIAC_CN: string[];
declare const ZODIAC_TO_YI: Map<string, string>;
declare const ZODIAC_TO_CN: Map<string, string>;
declare const MONTH_DARK: string[];
declare const MONTH_DARK_CN: string[];
declare const DIRECTION: string[];
declare const DIRECTION_CN: string[];

/**
 * YiLunar —— npm 库脚手架示例入口
 * 在此处导出你的库 API，供外部 `import { ... } from "yi-lunar"` 使用。
 */
/** 库版本号 */
declare const VERSION = "0.1.0";

export { DIRECTION, DIRECTION_CN, GAN, type HouseBuildLevel, JIA_ZI_60, JI_SHENG, KU_JIOR, LASE, MONTH_DARK, MONTH_DARK_CN, type MoonAlcyoneConjunctionOptions, type MoonAlcyoneConjunctionResult, type Result, VERSION, WU_XING, type WuXing, XINGXIUM_MAP, type XingxiuResult, YIN_YANG, type YearInfo, ZENG_TA, ZHI, ZODIAC, ZODIAC_CN, ZODIAC_TO_CN, ZODIAC_TO_YI, getGanZhiIndex, getHouseBuild, getJiSheng, getKujior, getLaSe, getMoonAlcyoneConjunction, getSuizhiXing, getTodayFortune, getWuXing, getXiDe, getXingxiu, getYearInfo, getYiAge, getYiDate, getYiTaBoo, getYinYang, getZeTa };
