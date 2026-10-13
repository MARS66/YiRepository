import { describe, it } from "vitest";
import { getZeTa, getYiTaBoo, getKujior } from "../src/index";

describe("components/getDate", () => {
  it("彝族日历", () => {
    console.log(getYiTaBoo("2027-02-06"));
    console.log(getZeTa("2027-02-06"));
    console.log(getKujior("2027-02-06"));
  });
});
