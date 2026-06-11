import OpenAI from "openai";

let client: OpenAI | null = null;
let adminClient: OpenAI | null = null;

// Lazily instantiate so the server can boot even without the key set.
// The SDK reads OPENAI_API_KEY from the environment automatically.
export const openai = () => {
  if (!client) client = new OpenAI();
  return client;
};

// Separate client authenticated with an Admin API key. The organization
// usage/cost endpoints reject normal API keys, so they need their own client.
export const openaiAdmin = () => {
  if (!adminClient) adminClient = new OpenAI({ adminAPIKey: process.env.OPENAI_ADMIN_KEY });
  return adminClient;
};

export const OPENAI_MODEL = "gpt-5.4-nano";
