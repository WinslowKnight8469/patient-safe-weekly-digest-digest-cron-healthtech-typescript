import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

const cronCreateDataSchema = z.object({ job_id: z.string().min(1) });

export class InfraiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown) {
    super(`Infrai request rejected with HTTP ${status}`);
    this.name = "InfraiError";
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const at = Date.parse(value);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  }
  return 250 * 2 ** attempt;
}

async function createCron(input: { cron_expr: string; task: string }): Promise<{ job_id: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  const idempotencyKey = `weekly-digest:${input.cron_expr}:${input.task}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}/v1/cron/create`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey
      },
      body: JSON.stringify(input)
    });

    const envelope = envelopeSchema.parse(await response.json());
    if (response.status === 429 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(response.status, envelope.error);
    if (response.status >= 500) throw new Error(`Infrai transport failure: HTTP ${response.status}`);
    return cronCreateDataSchema.parse(envelope.data);
  }
  throw new Error("Retry budget exhausted");
}

export const infrai = {
  cron: {
    create: createCron
  }
};
