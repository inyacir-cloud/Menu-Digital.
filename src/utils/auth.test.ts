import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, isPasswordMatch } from "./hash.ts";

test("accepts both the legacy default and the new default while the old hash is still stored", () => {
  const legacyHash = hashPassword("gordoflaca");
  assert.equal(isPasswordMatch("gordoflaca", legacyHash), true);
  assert.equal(isPasswordMatch("251225", legacyHash), false);
});

test("keeps the current stored hash valid for the configured password", () => {
  const activeHash = hashPassword("251225");
  assert.equal(isPasswordMatch("251225", activeHash), true);
  assert.equal(isPasswordMatch("gordoflaca", activeHash), false);
});
