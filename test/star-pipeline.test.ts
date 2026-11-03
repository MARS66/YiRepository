import { describe, expect, it } from "vitest";
import { SwissEph } from "@typescriptify/sweph/dist/SwissEph/index.js";
import { SE_MOON, SE_SUN } from "@typescriptify/sweph/dist/constants.js";

const DEG = Math.PI / 180;

// 通用恒星黄经推算：自行 + IAU1976 岁差 + 平黄赤交角 + 主导章动项
// 与组件 getMoonAlcyoneConjunction.ts 中 alcyoneEclipticLongitude 同一套算法
function starEclipticLongitude(jd: number, star: { ra: number; dec: number; pmRa: number; pmDec: number }): number {
  const T = (jd - 2451545.0) / 36525;
  const tYear = (jd - 2451545.0) / 365.25;
  const ra = star.ra + (star.pmRa / Math.cos(star.dec * DEG) / 1e3 / 3600) * tYear;
  const dec = star.dec + (star.pmDec / 1e3 / 3600) * tYear;
  const zeta = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * T) / 3600;
  const z = (((2306.2181 + 1.39656 * T - 0.000139 * T * T) * T + (0.30188 - 0.000344 * T) * T * T)) / 3600;
  const theta = ((2004.3109 - 0.8533 * T - 0.000217 * T * T) * T) / 3600;
  const cZ = Math.cos(zeta * DEG);
  const sZ = Math.sin(zeta * DEG);
  const cT = Math.cos(theta * DEG);
  const sT = Math.sin(theta * DEG);
  const cZ2 = Math.cos(z * DEG);
  const sZ2 = Math.sin(z * DEG);
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
  const eps = (23.4392911111 - 0.013004167 * T - 0.000000164 * T * T + 0.000000504 * T * T * T) * DEG;
  const a = raOfDate * DEG;
  const d = decOfDate * DEG;
  const lon =
    Math.atan2(
      Math.sin(d) * Math.sin(eps) + Math.cos(d) * Math.cos(eps) * Math.sin(a),
      Math.cos(d) * Math.cos(a),
    ) / DEG;
  const Om = (125.04452 - 1934.136261 * T) * DEG;
  const Ls = (280.4665 + 36000.7698 * T) * DEG;
  const Lm = (218.3165 + 481267.8813 * T) * DEG;
  const dPsi =
    (-17.2 * Math.sin(Om) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om)) / 3600;
  return ((lon + dPsi) % 360 + 360) % 360;
}

const SPICA = {
  ra: (13 + 25 / 60 + 11.57937 / 3600) * 15,
  dec: -(11 + 9 / 60 + 40.7501 / 3600),
  pmRa: -42.35,
  pmDec: -30.67,
};
const ALCYONE = {
  ra: (3 + 47 / 60 + 29.076 / 3600) * 15,
  dec: 24 + 6 / 60 + 18.49 / 3600,
  pmRa: 20.05,
  pmDec: -43.66,
};

describe("恒星黄经推算管线验证", () => {
  it("J2000 时刻与 sweph 内置星表（Spica）一致（< 2 角分）", () => {
    const swe = new SwissEph();
    const jd = 2451545.0; // J2000：无岁差，sweph 该时刻结果可靠
    const mine = starEclipticLongitude(jd, SPICA);
    const ref = swe.fixedStar("Spica", jd).longitude;
    const diff = Math.abs(((mine - ref + 180) % 360) - 180);
    console.log(`Spica @J2000 推算=${mine.toFixed(5)} sweph=${ref.toFixed(5)} 差=${diff.toFixed(5)}°`);
    expect(diff).toBeLessThan(0.04);
    swe.close();
  });

  it("岁差漂移率约为 1.4°/世纪（50″/年）；sweph 内置 fixstar 双倍岁差，故不采用", () => {
    const jCent = 2451545.0 + 36525;
    const drift = starEclipticLongitude(jCent, SPICA) - starEclipticLongitude(2451545.0, SPICA);
    console.log(`1 世纪黄经漂移=${drift.toFixed(4)}°（理论值≈1.397°）`);
    expect(drift).toBeGreaterThan(1.0);
    expect(drift).toBeLessThan(2.0);
  });

  it("Alcyone 黄经 J2000≈60°，2024≈60.3°，岁差使黄经逐年增大", () => {
    const j2000 = starEclipticLongitude(2451545.0, ALCYONE);
    const y2024 = starEclipticLongitude(SwissEph.julianDay(2024, 8, 10, 12), ALCYONE);
    console.log(`Alcyone @J2000=${j2000.toFixed(4)}° @2024-08=${y2024.toFixed(4)}°`);
    expect(Math.abs(j2000 - 60)).toBeLessThan(0.3);
    expect(y2024 - j2000).toBeGreaterThan(0.1);
  });

  it("swe.calc 引擎独立校验：2024-08-04 新月月亮黄经=太阳黄经≈132.5°", () => {
    const swe = new SwissEph();
    const jd = SwissEph.julianDay(2024, 8, 4, 11) + 13 / 60 / 24;
    const sun = swe.calc(jd, SE_SUN).longitude;
    const moon = swe.calc(jd, SE_MOON).longitude;
    const diff = Math.abs(((moon - sun + 180) % 360) - 180);
    console.log(`新月校验：太阳=${sun.toFixed(4)}° 月亮=${moon.toFixed(4)}° 差=${diff.toFixed(4)}°`);
    expect(Math.abs(sun - 132.5)).toBeLessThan(0.3);
    expect(diff).toBeLessThan(0.02);
    swe.close();
  });
});
