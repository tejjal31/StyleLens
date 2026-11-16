
/**
 * AI connection for StyleLens.
 * Uses Groq's OpenAI-compatible API.
 */
import OpenAI from "openai";

type ContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" };

function client() {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env["AI_BASE_URL"] || "https://api.groq.com/openai/v1",
  });
}

export async function aiJson<T>(
  system: string,
  content: ContentPart[],
  name: string,
  schema: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await client().chat.completions.create({
      model: process.env["AI_MODEL"] || "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `${system}\n\nYou MUST follow this JSON schema exactly:\n${JSON.stringify(schema)}\n\nReturn ONLY one valid JSON object. Include every required field with the correct data type. Do not use alternative field names. Do not include markdown or explanations.`,
        },
        {
          role: "user",
          content: content.map((c) =>
            c.type === "input_text"
              ? { type: "text" as const, text: c.text }
              : {
                type: "image_url" as const,
                image_url: { url: c.image_url, detail: c.detail },
              },
          ),
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const text = res.choices[0]?.message?.content;

    if (!text) {
      throw new Error("The stylist returned an empty answer. Please try again.");
    }
    console.log("Groq raw AI response:", text);
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.error("Groq AI error:", err.status, err.message);
      console.error("Groq error details:", JSON.stringify(err.error, null, 2));

      if (err.status === 429) {
        throw new Error("Groq rate limit reached. Please try again shortly.");
      }

      throw new Error("The AI stylist couldn't respond. Please try again.");
    }

    throw err;
  }
}
