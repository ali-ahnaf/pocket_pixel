import { Request, Response, Router } from "express";
import Joi from "joi";
import { openai, OPENAI_MODEL } from "./shared";
import { getCachedTags } from "../tags/shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

const promptSchema = Joi.object({
  prompt: Joi.string().max(1000).min(10).required(),
});

// What the model returns: tags by name, never by id.
interface ModelTransaction {
  title: string;
  amount: number;
  type: "expense" | "income";
  tags: string[];
}

// What we return to the client: tags resolved back to ids.
interface ParsedTransaction {
  title: string;
  amount: number;
  type: "expense" | "income";
  tagIds: string[];
}

router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = promptSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: "OPENAI_API_KEY is not configured" });
  }

  const tags = await getCachedTags(req.params.userId);
  // Resolve names back to ids; lowercased so the model's casing doesn't matter.
  const tagIdsByName = new Map(tags.map((tag) => [tag.name.toLowerCase(), tag.id]));
  const tagList = tags.map((tag) => `- ${tag.name}`).join("\n");

  const seedPrompt = `This is an expense tracker app. Translate the user's prompt into a transaction.
Only pick existing tag names from this list. Do not create new tags:
${tagList}
"title" should be a short 3-4 word description of the transaction.

prompt: ${value.prompt}`;

  // Constrain tags to existing names via an enum so the model cannot invent any.
  // An empty enum is an invalid schema, so fall back to a plain string array when
  // the user has no tags yet.
  const tagNames = tags.map((tag) => tag.name);
  const tagsSchema =
    tagNames.length > 0
      ? { type: "array", items: { type: "string", enum: tagNames } }
      : { type: "array", items: { type: "string" } };

  const response = await openai().responses.create({
    model: OPENAI_MODEL,
    input: seedPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "transaction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            amount: { type: "number" },
            type: { type: "string", enum: ["expense", "income"] },
            tags: tagsSchema,
          },
          required: ["title", "amount", "type", "tags"],
          additionalProperties: false,
        },
      },
    },
  });

  // Structured outputs guarantee valid JSON matching the schema, so a direct
  // parse is safe; the try/catch only guards against an empty/refusal response.
  let candidate: ModelTransaction;
  try {
    candidate = JSON.parse(response.output_text ?? "") as ModelTransaction;
  } catch {
    return res.status(502).json({ message: "Failed to parse AI response" });
  }

  // Map the returned tag names back to ids, dropping any the model invented.
  const tagIds = Array.isArray(candidate.tags)
    ? candidate.tags
        .filter((name): name is string => typeof name === "string")
        .map((name) => tagIdsByName.get(name.toLowerCase()))
        .filter((id): id is string => typeof id === "string")
    : [];

  const result: ParsedTransaction = {
    title: candidate.title,
    amount: candidate.amount,
    type: candidate.type,
    tagIds,
  };

  return res.json(result);
}));

export default router;
