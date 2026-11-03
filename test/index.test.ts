import { describe, expect, it } from "vitest";
import { getHouseBuild } from "../src/index";

const TODAY = "2026-10-30";

describe("components/getHouseBuild", () => {
  it("吉年吉日返回吉", () => {
    const result = getHouseBuild(38, "蛇", "2027-04-07", TODAY);
    expect(result.level).toBe("吉");
    expect(result.reasons.join("")).toContain("布都（东）");
    expect(result.reasons.join("")).toContain("能阿低");
  });

  it("岁位绝对禁忌年返回忌", () => {
    const result = getHouseBuild(31, "鼠", "2027-04-07", TODAY);
    expect(result.level).toBe("忌");
    expect(result.reasons.join("")).toContain("扭色果（东北）");
  });

  it("马日无论库纠吉凶都返回忌", () => {
    const result = getHouseBuild(38, "蛇", "2027-01-03", TODAY);
    expect(result.level).toBe("忌");
    expect(result.reasons.join("")).toContain("马日");
  });

  it("觉惹日返回忌", () => {
    const result = getHouseBuild(38, "蛇", "2027-01-01", TODAY);
    expect(result.level).toBe("忌");
    expect(result.reasons.join("")).toContain("觉惹");
  });

  it("命中岁位忌月返回忌", () => {
    const result = getHouseBuild(38, "蛇", "2027-04-02", TODAY);
    expect(result.level).toBe("忌");
    expect(result.reasons.join("")).toContain("兔月");
  });

  it("控制台输出综合结果与原因", () => {
    const cases: Array<[number, string, string]> = [
      [38, "蛇", "2027-04-07"],
      [31, "鼠", "2027-04-07"],
      [38, "蛇", "2027-01-03"],
      [38, "蛇", "2027-01-01"],
      [38, "蛇", "2027-04-02"],
    ];

    for (const [age, zodiac, date] of cases) {
      const result = getHouseBuild(age, zodiac, date, TODAY);
      console.log(`\n${date} | ${age}岁属${zodiac} | 综合:${result.level}`);
      result.reasons.forEach((reason) => console.log(`  - ${reason}`));
    }
  });
});
