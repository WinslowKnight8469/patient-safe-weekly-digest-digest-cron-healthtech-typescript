import { z } from "zod";

export const appointmentEventSchema = z.object({
  scheduledFor: z.string().datetime({ offset: true }),
  status: z.enum(["scheduled", "completed", "cancelled", "needs_follow_up"])
}).strict();

export type AppointmentEvent = z.infer<typeof appointmentEventSchema>;

export type WeeklyDigest = {
  periodStart: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  needsFollowUp: number | "hidden";
  notification: "send" | "skip";
};

const MIN_REPORTABLE_COHORT = 5;

export function buildWeeklyDigest(events: AppointmentEvent[], now: Date): WeeklyDigest {
  const periodEnd = now.getTime();
  const periodStart = periodEnd - 7 * 24 * 60 * 60 * 1_000;
  const current = events.filter((event) => {
    const at = Date.parse(event.scheduledFor);
    return at >= periodStart && at < periodEnd;
  });
  const count = (status: AppointmentEvent["status"]) =>
    current.filter((event) => event.status === status).length;
  const followUp = count("needs_follow_up");

  return {
    periodStart: new Date(periodStart).toISOString(),
    totalAppointments: current.length,
    completed: count("completed"),
    cancelled: count("cancelled"),
    needsFollowUp: followUp >= MIN_REPORTABLE_COHORT ? followUp : "hidden",
    notification: current.length === 0 ? "skip" : "send"
  };
}
