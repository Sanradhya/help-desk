import { expect, test } from "@jest/globals";
import { calculateTotal } from "./site3-cart";

test("returns a total for a priced item", () => {
  expect(calculateTotal(42, 0)).toBe(42);
});
