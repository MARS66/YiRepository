import { describe, expect, it } from "vitest";
import { add, VERSION } from "../src/index";

describe("add", () => {
  it("两数相加", () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
  });
});

describe("VERSION", () => {
  it("导出字符串版本号", () => {
    expect(typeof VERSION).toBe("string");
  });
});
