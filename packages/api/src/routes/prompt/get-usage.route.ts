import { Request, Response, Router } from "express";
import { openaiAdmin } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

// First second of the current UTC month — the window the report covers.
function startOfMonthUnix(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000);
}

interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
}

// GET /api/users/:userId/prompt/usage
// Reports this month's OpenAI token consumption, broken down per model.
// https://platform.openai.com/docs/api-reference/usage/completions
router.get(
  "/usage",
  asyncHandler(async (_req: Request, res: Response) => {
    if (!process.env.OPENAI_ADMIN_KEY) {
      return res.status(500).json({ message: "OPENAI_ADMIN_KEY is not configured" });
    }

    const startTime = startOfMonthUnix();
    const byModel = new Map<string, ModelUsage>();
    let inputTokens = 0;
    let outputTokens = 0;
    let requests = 0;
    let page: string | undefined;

    // Usage is bucketed by day and paginated; walk every page so totals are complete.
    do {
      const response = await openaiAdmin().admin.organization.usage.completions({
        start_time: startTime,
        bucket_width: "1d",
        limit: 31,
        group_by: ["model"],
        ...(page ? { page } : {}),
      });

      for (const bucket of response.data) {
        for (const result of bucket.results) {
          if (result.object !== "organization.usage.completions.result") continue;

          inputTokens += result.input_tokens;
          outputTokens += result.output_tokens;
          requests += result.num_model_requests;

          const name = result.model ?? "unknown";
          const entry = byModel.get(name) ?? { model: name, inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0 };
          entry.inputTokens += result.input_tokens;
          entry.outputTokens += result.output_tokens;
          entry.totalTokens += result.input_tokens + result.output_tokens;
          entry.requests += result.num_model_requests;
          byModel.set(name, entry);
        }
      }

      page = response.next_page ?? undefined;
    } while (page);

    return res.json({
      periodStart: startTime,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      requests,
      models: [...byModel.values()].sort((a, b) => b.totalTokens - a.totalTokens),
    });
  }),
);

export default router;
