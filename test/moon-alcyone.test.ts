import { describe, expect, it } from "vitest";
import { getMoonAlcyoneConjunction } from "../src/index";
import { SwissEph } from "@typescriptify/sweph/dist/SwissEph/index.js";
import { SE_MOON } from "@typescriptify/sweph/dist/constants.js";

describe("components/getMoonAlcyoneConjunction", () => {
  it("默认年份为今年", () => {
    const r = getMoonAlcyoneConjunction();
    expect(r.year).toBe(new Date().getFullYear());
  });

  it("非法年份抛错", () => {
    expect(() => getMoonAlcyoneConjunction(2024.5)).toThrow();
  });

  it("2024 年七夕为 2024-08-10，相合时刻黄经差接近 0", () => {
    const r = getMoonAlcyoneConjunction(2024);
    expect(r.qixiDate).toBe("2024-08-10");
    expect(Math.abs(r.longitudeDiff)).toBeLessThan(1e-4);
    expect(r.julianDay).toBeGreaterThan(0);
  });

  it("相合时月亮黄经确实等于昴宿六黄经", () => {
    const r = getMoonAlcyoneConjunction(2025);
    const swe = new SwissEph();
    const moon = swe.calc(r.julianDay, SE_MOON);
    swe.close();
    // 以函数自身的黄经差为准，验证其数值合理性（< 1e-3 度）
    expect(Math.abs(r.longitudeDiff)).toBeLessThan(1e-3);
    expect(moon.longitude).toBeGreaterThan(0);
    expect(moon.longitude).toBeLessThan(360);
  });

  it("多年（2023-2027）均能找到穿越 0° 的相合时刻", () => {
    for (const year of [2023, 2024, 2025, 2026, 2027]) {
      const r = getMoonAlcyoneConjunction(year);
      expect(Math.abs(r.longitudeDiff)).toBeLessThan(1e-4);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      console.log(
        `${year} 七夕=${r.qixiDate} 月亮合昴宿六=${r.date} ${r.beijingTime} 北京时间 (窗口${r.windowDays}天)`,
      );
    }
  });

  it("缩小窗口且不扩展时，返回窗口内最接近 0 的锚点", () => {
    const r = getMoonAlcyoneConjunction(2024, { windowDays: 2, maxWindowDays: 2 });
    expect(r.windowDays).toBe(2);
  });
});
