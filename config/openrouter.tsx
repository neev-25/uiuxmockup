/** Default model — set OPENROUTER_MODEL in .env to override */
export const AI_MODEL =
  process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

/** Max completion tokens — kept low so OpenRouter credit checks pass */
export const AI_MAX_TOKENS_CONFIG = Number(
  process.env.OPENROUTER_MAX_TOKENS_CONFIG ?? 1536
);

export const AI_MAX_TOKENS_UI = Number(
  process.env.OPENROUTER_MAX_TOKENS_UI ?? 4096
);

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: Array<{ type: "text"; text: string }>;
};

type ChatOptions = {
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  responseFormat?: { type: "json_object" } | { type: "text" };
};

type ChatCompletionResult = {
  choices: Array<{ message: { content: string } }>;
};

function trimMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map(({ role, content }) => {
    const text = content.map((part) => part.text).join("\n");
    const maxLen = role === "system" ? 6000 : 4000;
    return {
      role,
      content: text.length > maxLen ? `${text.slice(0, maxLen)}…` : text,
    };
  });
}

/**
 * Direct OpenRouter API call — guarantees max_tokens is sent.
 */
export async function createChatCompletion(
  options: ChatOptions
): Promise<ChatCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const messages = trimMessages(options.messages);

  const body: Record<string, unknown> = {
    model: AI_MODEL,
    messages,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens,
    max_completion_tokens: options.maxTokens,
    stream: false,
    reasoning: { effort: "none" },
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(
      `API error occurred: Status ${response.status}\nBody: ${responseText}`
    ) as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }

  const data = JSON.parse(responseText) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    choices: [{ message: { content } }],
  };
}

export function getOpenRouterStatusCode(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return 500;
}

export function getOpenRouterErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const bodyMatch = error.message.match(/Body: (\{[\s\S]*\})/);
    if (bodyMatch) {
      try {
        const parsed = JSON.parse(bodyMatch[1]) as {
          error?: { message?: string; code?: number };
        };
        if (parsed.error?.code === 402) {
          return "Insufficient OpenRouter credits. Add credits at openrouter.ai/settings/credits, then retry.";
        }
        if (parsed.error?.message) return parsed.error.message;
      } catch {
        // fall through
      }
    }
    if (error.message.includes("invalid JSON")) {
      return "AI returned invalid JSON. Please retry.";
    }
    return error.message;
  }
  return "Unknown error";
}
