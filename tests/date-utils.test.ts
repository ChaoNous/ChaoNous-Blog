import assert from "node:assert/strict";
import test from "node:test";
import { getRunningDays } from "../src/utils/date-utils.ts";

test("getRunningDays respects the configured site timezone", () => {
  assert.equal(
    getRunningDays("2026-03-03", 8, new Date("2026-04-15T00:30:00.000Z")),
    43,
  );

  assert.equal(
    getRunningDays("2026-03-03", -5, new Date("2026-03-04T04:30:00.000Z")),
    0,
  );

  assert.equal(
    getRunningDays("2026-03-03", -5, new Date("2026-03-04T05:30:00.000Z")),
    1,
  );
});
