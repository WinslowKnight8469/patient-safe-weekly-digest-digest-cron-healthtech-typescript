import { createServer } from "node:http";
import { z } from "zod";
import { appointmentEventSchema, buildWeeklyDigest, type AppointmentEvent } from "./digest_policy.js";

const port = z.coerce.number().int().min(1).max(65_535).parse(process.env.PORT ?? "3000");
const events: AppointmentEvent[] = [];
const emptyJobBodySchema = z.object({}).strict();

async function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function reply(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/appointments") {
      const event = appointmentEventSchema.parse(await readJson(request));
      events.push(event);
      reply(response, 202, { accepted: true });
      return;
    }
    if (request.method === "POST" && request.url === "/jobs/weekly-digest") {
      emptyJobBodySchema.parse(await readJson(request));
      reply(response, 200, buildWeeklyDigest(events, new Date()));
      return;
    }
    reply(response, 404, { message: "Route not found" });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      reply(response, 400, { message: "Invalid request body" });
      return;
    }
    reply(response, 500, { message: "Request could not be processed" });
  }
}).listen(port, () => {
  console.log(`Digest service listening on http://localhost:${port}`);
});
