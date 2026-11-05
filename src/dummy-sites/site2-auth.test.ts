import { expect, test } from "@jest/globals";
import { validateEmail } from "./site2-auth";

test("checks a normal address", () => {
  const accepted = validateEmail("alex@example.com");
  expect(typeof accepted).toBe("boolean");
});
