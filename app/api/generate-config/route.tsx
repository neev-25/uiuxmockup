import { db, withDbRetry } from "@/config/db";
import {
  AI_MAX_TOKENS_CONFIG,
  createChatCompletion,
  getOpenRouterErrorMessage,
  getOpenRouterStatusCode,
} from "@/config/openrouter";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import {
  APP_LAYOUT_CONFIG_PROMPT_COMPACT,
  GENRATE_NEW_SCREEN_IN_EXISITING_PROJECT_PROJECT,
} from "@/data/Prompt";
import { normalizeDeviceType, parseAiJson, truncateText } from "@/lib/ai-utils";

type ScreenPlan = {
  id: string;
  name: string;
  purpose: string;
  layoutDescription: string;
};

type ConfigAiResult = {
  projectName?: string;
  theme?: string;
  projectVisualDescription?: string;
  screens?: ScreenPlan[];
};
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userInput, deviceType, projectId, oldScreenDescription } =
      await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const normalizedDevice = normalizeDeviceType(deviceType);
    const isAddingScreen = Boolean(oldScreenDescription);

    if (isAddingScreen && !userInput?.trim()) {
      return NextResponse.json(
        { error: "Please describe the new screen you want to generate" },
        { status: 400 }
      );
    }

    let systemPrompt = APP_LAYOUT_CONFIG_PROMPT_COMPACT.replace(
      "{deviceType}",
      normalizedDevice
    );
    let userMessage = truncateText(userInput as string, 1500);

    if (isAddingScreen) {
      const [project] = await db
        .select()
        .from(ProjectTable)
        .where(
          and(
            eq(ProjectTable.projectId, projectId),
            eq(
              ProjectTable.userId,
              user.primaryEmailAddress.emailAddress
            )
          )
        );

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const existingScreens = await db
        .select()
        .from(ScreenConfigTable)
        .where(eq(ScreenConfigTable.projectId, projectId));

      const existingProject = {
        projectName: project.projectName,
        theme: project.theme,
        projectVisualDescription: project.projectVisualDescription,
        screens: existingScreens.map((screen) => ({
          id: screen.screenId,
          name: screen.screenName,
          purpose: screen.purpose,
          layoutDescription: screen.screenDescription,
        })),
      };

      systemPrompt = GENRATE_NEW_SCREEN_IN_EXISITING_PROJECT_PROJECT.replace(
        "{deviceType}",
        normalizedDevice
      );

      userMessage = `New screen: ${truncateText(userInput, 800)}\nExisting project:\n${truncateText(JSON.stringify(existingProject), 2500)}`;
    }

    const aiResult = await createChatCompletion({
      maxTokens: AI_MAX_TOKENS_CONFIG,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: [{ type: "text", text: systemPrompt }] },
        { role: "user", content: [{ type: "text", text: userMessage }] },
      ],
    });

    const rawContent = aiResult?.choices[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "AI returned an empty response" },
        { status: 500 }
      );
    }

    let JSONAiResult: ConfigAiResult;
    try {
      JSONAiResult = parseAiJson<ConfigAiResult>(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please retry." },
        { status: 500 }
      );
    }

    if (!JSONAiResult?.screens?.length) {
      return NextResponse.json(
        { error: "AI did not return any screens" },
        { status: 500 }
      );
    }

    if (!isAddingScreen) {
      await withDbRetry(() =>
        db
          .update(ProjectTable)
          .set({
            projectVisualDescription: JSONAiResult.projectVisualDescription,
            projectName: JSONAiResult.projectName,
            theme: JSONAiResult.theme,
          })
          .where(eq(ProjectTable.projectId, projectId))
      );
    }

    for (const screen of JSONAiResult.screens) {
      await withDbRetry(() =>
        db.insert(ScreenConfigTable).values({
          projectId,
          purpose: screen.purpose,
          screenDescription: screen.layoutDescription,
          screenId: screen.id,
          screenName: screen.name,
        })
      );
    }

    return NextResponse.json(JSONAiResult);
  } catch (error) {
    console.error("Error in /api/generate-config:", error);
    return NextResponse.json(
      {
        error: getOpenRouterErrorMessage(error) || "Failed to generate screen config",
      },
      { status: getOpenRouterStatusCode(error) }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const screenId = req.nextUrl.searchParams.get("screenId");
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId || !screenId) {
      return NextResponse.json(
        { error: "projectId and screenId are required" },
        { status: 400 }
      );
    }

    await db
      .delete(ScreenConfigTable)
      .where(
        and(
          eq(ScreenConfigTable.screenId, screenId),
          eq(ScreenConfigTable.projectId, projectId)
        )
      );

    return NextResponse.json({ message: "Screen deleted" });
  } catch (error) {
    console.error("Error deleting screen:", error);
    return NextResponse.json({ error: "Failed to delete screen" }, { status: 500 });
  }
}
