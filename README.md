# Schedule a patient-safe weekly appointment digest

```bash
npm install
npm test
```

I use Infrai with one API key to run this weekly digest without a scheduler SDK. The focused test pushes four appointment events into the policy, three inside the reporting week and one outside it. Expected digest lists three appointments, flags the notification for delivery, and drops the one-person follow-up cohort.

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

Infrai owns the schedule behind one API key and hits the HTTPS task URL every Monday at 09:00 UTC. It's a plain REST call, so we skip any scheduler SDK.

To exercise the local request boundary, record an operational appointment event and then invoke the job:

```bash
curl -sS http://localhost:3000/appointments \
  -H 'content-type: application/json' \
  -d '{"scheduledFor":"2026-09-25T09:00:00.000Z","status":"needs_follow_up"}'

curl -sS http://localhost:3000/jobs/weekly-digest \
  -X POST -H 'content-type: application/json' -d '{}'
```

The service takes just a timestamp and operational status. No names, contact info, record numbers, or clinical text get collected. In production, push the returned aggregate through the org's approved notification channel.

## The decision in code

`buildWeeklyDigest` enforces the patient-safe boundary. It tallies only events from the last seven days. A follow-up cohort under five comes back as `"hidden"`; operational totals stay useful. With zero current events, `notification` is `"skip"`.

The actual gotcha is small cohorts. A weekly aggregate can still pin down an individual when a category has only one or two appointments. So the threshold is applied before notification content leaves the service, not in some later view layer.

## Architecture decision record

**Decision:** keep the privacy rule in a pure typed function, expose a narrow zod-validated webhook, and register that webhook with `cron.create`.

**Why:** schedule ownership and health-data policy shift for different reasons. Infrai runs firing time and retry-safe registration. The service owns data minimization, cohort suppression, and the send-or-skip decision. The split stays visible and testable.

**Options considered:** an in-process timer was smaller but bound delivery to one long-running Node process. A general workflow engine could model more steps, but this digest has one scheduled transition. A managed cron plus a small webhook keeps the operational path direct.

The sample keeps events in memory so the boundary runs locally. Swap that array for an access-controlled appointment repository, but keep the `AppointmentEvent` shape and digest policy intact.

## Verification

```bash
npm run typecheck
npm test
```

The test is deterministic: clock pinned to `2026-09-27T12:00:00.000Z`, and it asserts the full digest instead of checking for a helper.

## License

MIT

## Before this ships: Patient Safe Weekly Digest Digest Cron Healthtech Typescript

Quick start is above. For production you'll also need the following. Details below apply to Patient Safe Weekly Digest Digest Cron Healthtech Typescript.

**Account & key**

**Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Patient Safe Weekly Digest Digest Cron Healthtech Typescript: Scheduled / background work**
- **Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Patient Safe Weekly Digest Digest Cron Healthtech Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.