import assert from "node:assert/strict";
import test from "node:test";

import { relativeActivity } from "./relative-activity";

void test("relative bill activity changes at the next elapsed-day boundary", () => {
  const activityAt = new Date("2026-09-03T07:00:00.000Z");

  assert.equal(
    relativeActivity(activityAt, Date.parse("2026-09-05T06:59:59.999Z")),
    "1 day ago",
  );
  assert.equal(
    relativeActivity(activityAt, Date.parse("2026-09-05T07:00:00.000Z")),
    "2 days ago",
  );
});

void test("relative bill activity becomes an absolute date after 30 days", () => {
  const activityAt = new Date("2026-08-01T07:00:00.000Z");
  assert.equal(
    relativeActivity(activityAt, Date.parse("2026-09-05T07:00:00.000Z")),
    "Aug 1",
  );
});
