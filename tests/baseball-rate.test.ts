import test from "node:test";
import assert from "node:assert/strict";
import { formatBaseballRate } from "../src/lib/baseball-rate.ts";
test("baseball rates use three decimals, with no percentage scaling", () => {
  for (const [input, expected] of [[.75, ".750"], [2/3, ".667"], [0, ".000"], [1, "1.000"], [null, "—"], [undefined, "—"]] as const)
    assert.equal(formatBaseballRate(input), expected);
});
