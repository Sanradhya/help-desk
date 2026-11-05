import { expect, test } from "@jest/globals";
import { applyReferralCode } from "./site1-checkout";

test("applies lowercase save10 as 10% off", () => {
  expect(applyReferralCode("SAVE10", 200)).toBe(180);
  expect(applyReferralCode("save10", 200)).toBe(180);
});
