import { db, withDbRetry } from "@/config/db";
import {
  AI_MAX_TOKENS_UI,
  createChatCompletion,
  getOpenRouterErrorMessage,
  getOpenRouterStatusCode,
} from "@/config/openrouter";
import { ScreenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT_COMPACT } from "@/data/Prompt";
import { extractHtmlFromAiResponse, isValidScreenHtml, truncateText } from "@/lib/ai-utils";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { projectId, screenId, screenName, purpose, screenDescription } =
    await req.json();

  if (!projectId || !screenId) {
    return NextResponse.json(
      { error: "projectId and screenId are required" },
      { status: 400 }
    );
  }

  const userInput = `
Screen Name: ${screenName}
Purpose: ${purpose}
Layout: ${truncateText(screenDescription ?? "", 2500)}
  `.trim();

  try {
    const aiResult = await createChatCompletion({
      maxTokens: AI_MAX_TOKENS_UI,
      messages: [
        {
          role: "system",
          content: [{ type: "text", text: GENERATE_SCREEN_PROMPT_COMPACT }],
        },
        {
          role: "user",
          content: [{ type: "text", text: userInput }],
        },
      ],
    });

    const rawContent = aiResult?.choices[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    const code = extractHtmlFromAiResponse(rawContent);
    if (!isValidScreenHtml(code)) {
      return NextResponse.json(
        { error: "AI did not return valid HTML" },
        { status: 500 }
      );
    }

    const updateResult = await withDbRetry(() =>
      db
        .update(ScreenConfigTable)
        .set({ code })
        .where(
          and(
            eq(ScreenConfigTable.projectId, projectId),
            eq(ScreenConfigTable.screenId, screenId)
          )
        )
        .returning()
    );

    if (!updateResult.length) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    return NextResponse.json(updateResult[0]);
  } catch (error) {
    console.error("Error generating screen UI:", error);
    return NextResponse.json(
      {
        error: getOpenRouterErrorMessage(error) || "Internal Server Error",
      },
      { status: getOpenRouterStatusCode(error) }
    );
  }
}
