import assert from "node:assert/strict";
import { test } from "node:test";

import { houstonInputToIso, isoToHoustonInput } from "../src/lib/content/datetime.ts";

test("publication picker converts Houston daylight and standard times", () => {
  assert.equal(houstonInputToIso("2026-07-12T09:30"), "2026-07-12T14:30:00.000Z");
  assert.equal(houstonInputToIso("2026-12-13T09:30"), "2026-12-13T15:30:00.000Z");
  assert.equal(isoToHoustonInput("2026-07-12T14:30:00.000Z"), "2026-07-12T09:30");
});

test("publication picker rejects the skipped daylight-saving hour", () => {
  assert.throws(() => houstonInputToIso("2026-03-08T02:30"), /does not exist/);
});
