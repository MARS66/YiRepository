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

declare const getLaSe: (date?: string) => string[];

declare const getKujior: (date?: string) => {
    index: number;
    kujior: string[];
    start: string;
    offset: number;
};

declare function getZeTa(date: string): string[] | undefined;

declare function getTodayFortune(index: number): {
    taboo: string[];
    tabooFull: string;
};

/**
 * YiLunar —— npm 库脚手架示例入口
 * 在此处导出你的库 API，供外部 `import { ... } from "yi-lunar"` 使用。
 */

/** 库版本号 */
declare const VERSION = "0.1.0";

export { VERSION, getKujior, getLaSe, getTodayFortune, getYiDate, getYiTaBoo, getZeTa };
