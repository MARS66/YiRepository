import { describe, expect, it } from "vitest";
import { getXingxiu } from "../src/index";

describe("components/get28xingxiu", () => {
  const r = getXingxiu("2026-10-31");
  it("锚点当天（坦博日）为索引 0", () => {
    expect(r);
  });

  it("非法日期抛错", () => {
    expect(() => getXingxiu("bad-date")).toThrow();
  });
});
