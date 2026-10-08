import assert from "node:assert/strict";
import test from "node:test";
import { buildWeeklyDigest, type AppointmentEvent } from "../src/digest_policy.js";

test("hides a small follow-up cohort while keeping operational totals", () => {
  const events: AppointmentEvent[] = [
    { scheduledFor: "2026-09-25T09:00:00.000Z", status: "needs_follow_up" },
    { scheduledFor: "2026-09-24T09:00:00.000Z", status: "completed" },
    { scheduledFor: "2026-09-23T09:00:00.000Z", status: "cancelled" },
    { scheduledFor: "2026-09-10T09:00:00.000Z", status: "needs_follow_up" }
  ];

  const digest = buildWeeklyDigest(events, new Date("2026-09-27T12:00:00.000Z"));

  assert.deepEqual(digest, {
    periodStart: "2026-09-20T12:00:00.000Z",
    totalAppointments: 3,
    completed: 1,
    cancelled: 1,
    needsFollowUp: "hidden",
    notification: "send"
  });
});
