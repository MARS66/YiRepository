import { Lunar } from "lunar-typescript";
import { SwissEph } from "@typescriptify/sweph/dist/SwissEph/index.js";
import { SE_MOON, SE_GREG_CAL } from "@typescriptify/sweph/dist/constants.js";

/**
 * 计算每年农历七月初七（七夕）前后月亮与昴宿六（Alcyone，η Tauri）相合的阳历日期。
 *
 * 核心思路：
 * 1. 用 lunar-typescript 将农历七月初七换算为阳历日期，作为搜索窗口的中心；
 * 2. 在窗口内以小时为步长迭代，用 @typescriptify/sweph 计算月亮的视黄经，
 *    与按 J2000 赤道坐标自行推算（岁差 + 章动）的昴宿六视黄经求差；
 * 3. 找到黄经差变号（穿越 0°）的时间区间后，用二分法精化出相合时刻；
 * 4. 若默认窗口内无穿越，则自动向外扩展窗口，直至找到该年离七夕最近的相合。
 */

const DEG = Math.PI / 180;

/** 昴宿六（η Tauri / Alcyone）J2000 (ICRS) 赤道坐标与自行 */
const ALCYONE_J2000 = {
  /** 赤经（度） */
  ra: (3 + 47 / 60 + 29.076 / 3600) * 15,
  /** 赤纬（度） */
  dec: 24 + 6 / 60 + 18.49 / 3600,
  /** 赤经自行（mas/yr，含 cosδ） */
  pmRa: 20.05,
  /** 赤纬自行（mas/yr） */
  pmDec: -43.66,
} as const;

/** 将度数归一化到 [0, 360) */
function normalizeDeg(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** 将角度差归一化到 [-180, 180) */
function diff180(x: number): number {
  return normalizeDeg(x + 180) - 180;
}

/** 昴宿六的视黄经（度）。自行改正 → IAU 1976 岁差 → 黄赤交角 → 主导章动项。 */
function alcyoneEclipticLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525; // 儒略世纪数（自 J2000）
  const tYear = (jd - 2451545.0) / 365.25; // 儒略年数
  // 1) 自行改正到观测历元
  const ra = ALCYONE_J2000.ra + (ALCYONE_J2000.pmRa / Math.cos(ALCYONE_J2000.dec * DEG) / 1e3 / 3600) * tYear;
  const dec = ALCYONE_J2000.dec + (ALCYONE_J2000.pmDec / 1e3 / 3600) * tYear;
  // 2) IAU 1976 岁差角（角秒，Meeus 21.4）
  const zeta = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * T) / 3600;
  const z = (((2306.2181 + 1.39656 * T - 0.000139 * T * T) * T + (0.30188 - 0.000344 * T) * T * T)) / 3600;
  const theta = ((2004.3109 - 0.8533 * T - 0.000217 * T * T) * T) / 3600;
  const cZ = Math.cos(zeta * DEG);
  const sZ = Math.sin(zeta * DEG);
  const cT = Math.cos(theta * DEG);
  const sT = Math.sin(theta * DEG);
  const cZ2 = Math.cos(z * DEG);
  const sZ2 = Math.sin(z * DEG);
  // 岁差矩阵 P（J2000 → 当日平春分点）：v' = P·v
  const p11 = cZ2 * cT * cZ - sZ2 * sZ;
  const p12 = -cZ2 * cT * sZ - sZ2 * cZ;
  const p13 = -cZ2 * sT;
  const p21 = sZ2 * cT * cZ + cZ2 * sZ;
  const p22 = -sZ2 * cT * sZ + cZ2 * cZ;
  const p23 = -sZ2 * sT;
  const p31 = sT * cZ;
  const p32 = -sT * sZ;
  const p33 = cT;
  const x0 = Math.cos(dec * DEG) * Math.cos(ra * DEG);
  const y0 = Math.cos(dec * DEG) * Math.sin(ra * DEG);
  const z0 = Math.sin(dec * DEG);
  const x = p11 * x0 + p12 * y0 + p13 * z0;
  const y = p21 * x0 + p22 * y0 + p23 * z0;
  const zz = p31 * x0 + p32 * y0 + p33 * z0;
  const raOfDate = Math.atan2(y, x) / DEG;
  const decOfDate = Math.asin(zz) / DEG;
  // 3) 平黄赤交角（IAU 1980）
  const eps = (23.4392911111 - 0.013004167 * T - 0.000000164 * T * T + 0.000000504 * T * T * T) * DEG;
  // 4) 赤道 → 黄道黄经
  const a = raOfDate * DEG;
  const d = decOfDate * DEG;
  const lon =
    Math.atan2(
      Math.sin(d) * Math.sin(eps) + Math.cos(d) * Math.cos(eps) * Math.sin(a),
      Math.cos(d) * Math.cos(a),
    ) / DEG;
  // 5) 章动黄经主导项（IAU 1980，角秒）
  const Om = (125.04452 - 1934.136261 * T) * DEG;
  const Ls = (280.4665 + 36000.7698 * T) * DEG;
  const Lm = (218.3165 + 481267.8813 * T) * DEG;
  const dPsi =
    (-17.2 * Math.sin(Om) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om)) / 3600;
  return normalizeDeg(lon + dPsi);
}

export interface MoonAlcyoneConjunctionOptions {
  /** 搜索窗口的半宽（天），默认 7 */
  windowDays?: number;
  /** 粗扫步长（小时），默认 1 */
  stepHours?: number;
  /** 自动扩展窗口的最大半宽（天），默认 30 */
  maxWindowDays?: number;
}

export interface MoonAlcyoneConjunctionResult {
  /** 输入年份 */
  year: number;
  /** 相合时刻的阳历日期（北京时间 YYYY-MM-DD） */
  date: string;
  /** 相合时刻（北京时间 HH:mm） */
  beijingTime: string;
  /** 相合时刻（世界时） */
  utc: { year: number; month: number; day: number; hour: number; minute: number; second: number };
  /** 相合时刻的儒略日（UT） */
  julianDay: number;
  /** 相合时月亮与昴宿六的黄经差（度）；精确穿越时为 0 */
  longitudeDiff: number;
  /** 该年农历七月初七对应的阳历日期 */
  qixiDate: string;
  /** 最终使用的搜索半窗口天数（可能因自动扩展而大于 windowDays） */
  windowDays: number;
}

/** 补零到两位（避免依赖 padStart，兼容旧 iOS 小程序引擎） */
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/**
 * 计算指定年份七夕前后月亮与昴宿六相合的阳历日期。
 * @param year 年份，默认今年
 */
export function getMoonAlcyoneConjunction(
  year: number = new Date().getFullYear(),
  options: MoonAlcyoneConjunctionOptions = {},
): MoonAlcyoneConjunctionResult {
  if (!Number.isInteger(year)) throw new Error(`Invalid year: ${year}`);
  const windowDays = options.windowDays ?? 7;
  const stepHours = options.stepHours ?? 1;
  const maxWindowDays = options.maxWindowDays ?? 30;
  if (windowDays <= 0 || stepHours <= 0 || maxWindowDays < windowDays) {
    throw new Error("windowDays / stepHours 必须大于 0，且 maxWindowDays 不小于 windowDays");
  }

  const solar = Lunar.fromYmd(year, 7, 7).getSolar();
  const qixi = { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  const qixiJd = SwissEph.julianDay(qixi.year, qixi.month, qixi.day, 12, SE_GREG_CAL);

  const swe = new SwissEph();
  try {
    const diffAt = (jd: number): number => {
      const moon = swe.calc(jd, SE_MOON); // 月亮视黄经
      return diff180(moon.longitude - alcyoneEclipticLongitude(jd));
    };

    let wd = windowDays;
    let best = { jd: qixiJd, diff: Number.POSITIVE_INFINITY };
    let bracket: { lo: number; hi: number } | null = null;

    while (true) {
      const start = qixiJd - wd;
      const end = qixiJd + wd;
      const steps = Math.round(((end - start) * 24) / stepHours);
      let prevDiff = 0;
      for (let i = 0; i <= steps; i++) {
        const jd = start + (i * stepHours) / 24;
        const d = diffAt(jd);
        if (Math.abs(d) < Math.abs(best.diff)) {
          best = { jd, diff: d };
          if (d === 0) break;
        }
        // 仅在黄经差接近 0° 时视为穿越：排除 diff180 在 ±180° 处的换向跳变
        if (i > 0 && prevDiff * d <= 0 && Math.abs(prevDiff) < 90 && Math.abs(d) < 90) {
          bracket = { lo: jd - stepHours / 24, hi: jd };
          break;
        }
        prevDiff = d;
      }
      if (bracket || wd >= maxWindowDays) break;
      wd = Math.min(wd + windowDays, maxWindowDays); // 未找到穿越，自动扩展窗口
    }

    let anchorJd: number;
    let minDiff: number;
    if (bracket) {
      // 二分法精化黄经差穿越 0° 的时刻
      let lo = bracket.lo;
      let hi = bracket.hi;
      let flo = diffAt(lo);
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const fm = diffAt(mid);
        if (fm === 0 || flo * fm <= 0) {
          hi = mid; // 根在 [lo, mid]
        } else {
          lo = mid;
          flo = fm; // 根在 [mid, hi]
        }
      }
      anchorJd = (lo + hi) / 2;
      minDiff = diffAt(anchorJd);
    } else {
      anchorJd = best.jd;
      minDiff = best.diff;
    }

    // 相合时刻的北京时间（UTC+8）
    const beijingMs = (anchorJd - 2440587.5) * 86400000 + 8 * 3600000;
    const b = new Date(beijingMs);
    const utc = SwissEph.fromJulianDay(anchorJd, SE_GREG_CAL);
    const totalMinutes = utc.hour * 60;
    const hour = Math.floor(totalMinutes / 60);
    const minute = Math.floor(totalMinutes) % 60;
    const second = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60) % 60;

    return {
      year,
      date: `${b.getUTCFullYear()}-${pad2(b.getUTCMonth() + 1)}-${pad2(b.getUTCDate())}`,
      beijingTime: `${pad2(b.getUTCHours())}:${pad2(b.getUTCMinutes())}`,
      utc: { year: utc.year, month: utc.month, day: utc.day, hour, minute, second },
      julianDay: anchorJd,
      longitudeDiff: minDiff,
      qixiDate: `${qixi.year}-${pad2(qixi.month)}-${pad2(qixi.day)}`,
      windowDays: wd,
    };
  } finally {
    swe.close();
  }
}
