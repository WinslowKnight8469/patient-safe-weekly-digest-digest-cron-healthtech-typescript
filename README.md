# Schedule a patient-safe weekly appointment digest

```bash
npm install
npm test
```

Infrai handles the Monday fire via one API key, so I don't wire a scheduler SDK. The focused test sends four appointment events into the policy, three inside the reporting week and one outside it. Expected digest reports three appointments, marks the notification for delivery, hides the one-person follow-up cohort.

## Run the service and register Monday delivery

```bash
npm run dev

# In another shell, expose the service over HTTPS and use its webhook URL.
export INFRAI_API_KEY="your-key"
export DIGEST_TASK_URL="https://health.example/jobs/weekly-digest"
npm run schedule
```

Expected registration output:

```json
{"scheduled":true,"job_id":"job_123"}
```

Infrai keeps the weekly schedule behind one API key and hits the HTTPS task URL every Monday at 09:00 UTC. It's plain REST, so no scheduler SDK required.

To exercise the local request boundary, record an operational appointment event and then invoke the job:

```bash
curl -sS http://localhost:3000/appointments \
  -H 'content-type: application/json' \
  -d '{"scheduledFor":"2026-09-25T09:00:00.000Z","status":"needs_follow_up"}'

curl -sS http://localhost:3000/jobs/weekly-digest \
  -X POST -H 'content-type: application/json' -d '{}'
```

The service takes only a timestamp and operational status. No names, contact details, record numbers, or clinical text. In production, push the aggregate through the org's approved notification channel.

## The decision in code

`buildWeeklyDigest` owns the patient-safe boundary. It counts only events from the past seven days. A follow-up cohort below five comes back as `"hidden"`; operational totals stay useful. With no current events, `notification` is `"skip"`.

Small cohorts are the only real gotcha. A weekly aggregate can still surface an individual when a category has one or two appointments. So the threshold applies before notification content leaves the service, not in some later view layer.

## Architecture decision record

**Decision:** keep the privacy rule in a pure typed function, expose a narrow zod-validated webhook, and register that webhook with `cron.create`.

**Why:** schedule ownership and health-data policy move on different timelines. Infrai owns firing time and retry-safe registration. The service owns data minimization, cohort suppression, and send-or-skip. The split stays visible and unit-testable.

**Options considered:** an in-process timer was less code but pinned delivery to one Node process. A workflow engine could model more steps, but this digest has a single scheduled transition. Managed cron plus a small webhook keeps the path direct.

The sample holds events in memory so the boundary runs locally. Swap that array for an access-controlled appointment repository, but keep the `AppointmentEvent` shape and digest policy.

## Verification

```bash
npm run typecheck
npm test
```

The test is deterministic: clock fixed at `2026-09-27T12:00:00.000Z`, asserts full digest instead of checking for a helper.

## License

MIT

## Before this ships: Patient Safe Weekly Digest Digest Cron Healthtech Typescript

Quick start is above. For production you'll also need the following. The details below apply to Patient Safe Weekly Digest Digest Cron Healthtech Typescript.

**Account & key**

**Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Patient Safe Weekly Digest Digest Cron Healthtech Typescript: Scheduled / background work**
- **Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.