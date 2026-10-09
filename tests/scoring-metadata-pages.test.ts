import test from "node:test";
import assert from "node:assert/strict";
import { scoringMetadataPages } from "../src/lib/scoring-metadata-pages.ts";
test("metadata reader handles API caps smaller than the requested page without omissions", async () => {
  const rows = Array.from({ length: 225 }, (_, id) => ({ id }));
  const result = await scoringMetadataPages(async (start) => ({
    data: rows.slice(start, start + 73),
    error: null,
  }));
  assert.deepEqual(result, { data: rows, error: null });
});
test("metadata failures and an endless capped feed never appear complete", async () => {
  assert.deepEqual(
    await scoringMetadataPages(async () => ({
      data: null,
      error: { code: "42501" },
    })),
    { data: null, error: true },
  );
  let calls = 0;
  assert.deepEqual(
    await scoringMetadataPages(async () => {
      calls++;
      return { data: [{ id: 1 }], error: null };
    }),
    { data: null, error: true },
  );
  assert.equal(calls, 50);
});
