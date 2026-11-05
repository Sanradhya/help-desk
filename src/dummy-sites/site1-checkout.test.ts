import { expect, test } from "@jest/globals";
import { applyReferralCode } from "./site1-checkout";

test("applies SAVE10 and WELCOME5 to a subtotal", () => {
  expect(applyReferralCode("SAVE10", 200)).toBe(180);
  expect(applyReferralCode("WELCOME5", 200)).toBe(190);
});
