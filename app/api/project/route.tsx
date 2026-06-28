import { db, withDbRetry } from "@/config/db";
import { ProjectTable, ScreenConfigTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userInput, device, projectId } = await req.json();

    if (!userInput || !device || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await currentUser();
    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail));

    if (existingUsers.length === 0) {
      await db.insert(usersTable).values({
        name: user.fullName || "",
        email: userEmail,
      });
    }

    const result = await db
      .insert(ProjectTable)
      .values({
        projectId,
        userId: userEmail,
        device,
        userInput,
      })
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error in /api/project POST:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    if (!projectId) {
      const result = await db
        .select()
        .from(ProjectTable)
        .where(eq(ProjectTable.userId, userEmail))
        .orderBy(desc(ProjectTable.id));

      return NextResponse.json(result);
    }

    const result = await db
      .select()
      .from(ProjectTable)
      .where(
        and(
          eq(ProjectTable.projectId, projectId),
          eq(ProjectTable.userId, userEmail)
        )
      );

    if (!result.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const screenConfig = await db
      .select()
      .from(ScreenConfigTable)
      .where(eq(ScreenConfigTable.projectId, projectId));

    return NextResponse.json({
      projectDetail: result[0],
      screenConfig,
    });
  } catch (error) {
    console.error("Error in /api/project GET:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { projectName, theme, projectId, screenShot } = await req.json();
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (projectName !== undefined) updateData.projectName = projectName;
    if (theme !== undefined) updateData.theme = theme;
    if (screenShot !== undefined) updateData.screenShot = screenShot;

    const result = await db
      .update(ProjectTable)
      .set(updateData)
      .where(
        and(
          eq(ProjectTable.projectId, projectId),
          eq(ProjectTable.userId, user.primaryEmailAddress.emailAddress)
        )
      )
      .returning();

    if (!result.length) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    const existing = await db
      .select()
      .from(ProjectTable)
      .where(
        and(
          eq(ProjectTable.projectId, projectId),
          eq(ProjectTable.userId, userEmail)
        )
      );

    if (!existing.length) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    await withDbRetry(() =>
      db
        .delete(ScreenConfigTable)
        .where(eq(ScreenConfigTable.projectId, projectId))
    );

    await withDbRetry(() =>
      db
        .delete(ProjectTable)
        .where(
          and(
            eq(ProjectTable.projectId, projectId),
            eq(ProjectTable.userId, userEmail)
          )
        )
    );

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
