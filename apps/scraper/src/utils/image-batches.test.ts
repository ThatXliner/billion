import assert from "node:assert/strict";
import test from "node:test";

import { runImageBatches } from "./image-batches.js";

void test("drains more than one candidate limit and verifies the empty remainder", async () => {
  let missing = 331;
  let queries = 0;
  await runImageBatches(async () => {
    queries++;
    const completed = Math.min(missing, 80);
    missing -= completed;
    return { completed, failed: 0 };
  }, true);
  assert.equal(missing, 0);
  assert.equal(queries, 6);
});

void test("stops on failure instead of looping over the same broken candidate", async () => {
  let attempts = 0;
  await runImageBatches(async () => {
    attempts++;
    return { completed: 79, failed: 1 };
  }, true);
  assert.equal(attempts, 1);
});

void test("ordinary bounded invocations still run exactly one batch", async () => {
  let attempts = 0;
  await runImageBatches(async () => {
    attempts++;
    return { completed: 80, failed: 0 };
  }, false);
  assert.equal(attempts, 1);
});
