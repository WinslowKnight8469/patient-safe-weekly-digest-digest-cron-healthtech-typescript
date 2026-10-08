import { z } from "zod";
import { infrai } from "./infrai_client.js";

const taskUrl = z.string().url().parse(process.env.DIGEST_TASK_URL);

const result = await infrai.cron.create({
  cron_expr: "0 9 * * 1",
  task: taskUrl
});

console.log(JSON.stringify({ scheduled: true, job_id: result.job_id }));
