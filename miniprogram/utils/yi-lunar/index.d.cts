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

declare const getYiTaBoo: (date?: string) => {
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

export { DIRECTION, DIRECTION_CN, KU_JIOR, LASE, MONTH_DARK, MONTH_DARK_CN, VERSION, ZENG_TA, ZODIAC, ZODIAC_CN, ZODIAC_TO_CN, ZODIAC_TO_YI, getKujior, getLaSe, getTodayFortune, getXiDe, getYiAge, getYiDate, getYiTaBoo, getZeTa };
