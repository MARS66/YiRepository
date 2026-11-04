import { describe, it } from "vitest";
import { getYearInfo, getGanZhiIndex } from "../src/index";

describe("components/getYearInfo", () => {
  it("甲子返回 1，癸亥返回 60", () => {
    console.log(getGanZhiIndex("1984-10-30"), getYearInfo("2044-10-30"));
  });
});
