import assert from "node:assert/strict";
import test from "node:test";
import { calcMovingAverage } from "../src/scripts/btc-analysis/chart-options.ts";
import { formatTime } from "../src/scripts/music-player/player-format.ts";

test("calcMovingAverage pads early values and rounds completed windows", () => {
  assert.deepEqual(calcMovingAverage([1, 2, 3, 4], 3), [null, null, 2, 3]);
  assert.deepEqual(calcMovingAverage([1, 2, 4], 2), [null, 1.5, 3]);
});

test("formatTime handles invalid and normal playback times", () => {
  assert.equal(formatTime(Number.NaN), "0:00");
  assert.equal(formatTime(-1), "0:00");
  assert.equal(formatTime(65), "1:05");
});
