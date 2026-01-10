import { db } from "@/config/db";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    const {userInput,device,projectId}=await req.json();
    const user=await currentUser();
    const result=await db.insert(ProjectTable).values({
        projectId:projectId,
        userId:user?.primaryEmailAddress?.emailAddress as string,
        device:device,
        userInput:userInput
    }).returning();

    return NextResponse.json(result[0]);

}
export async function GET(req:NextRequest) {
    const projectId=await req.nextUrl.searchParams.get('projectId');
    const user=await currentUser()
    try
    {
    const result=await db.select().from(ProjectTable)
    .where(and(eq(ProjectTable.projectId,projectId as string),eq(ProjectTable.userId,user?.primaryEmailAddress?.emailAddress as string)));
    
    const ScreenConfig=await db.select().from(ScreenConfigTable)
    .where(eq(ScreenConfigTable.projectId,projectId as string))
    return NextResponse.json({
        projectDetail:result[0],
        screenConfig:ScreenConfig
    });
    }
    catch{
        return NextResponse.json({msg:'error'})
    }
    
}

export async function PUT(req:NextRequest) {
    try {
        const {projectName,theme,projectId}=await req.json();
        const user=await currentUser();
        
        if (!projectId) {
            return NextResponse.json({error: 'projectId is required'}, {status: 400});
        }
        
        const updateData: any = {};
        if (projectName !== undefined) updateData.projectName = projectName;
        if (theme !== undefined) updateData.theme = theme;
        
        const result=await db.update(ProjectTable)
            .set(updateData)
            .where(and(
                eq(ProjectTable.projectId,projectId),
                eq(ProjectTable.userId, user?.primaryEmailAddress?.emailAddress as string)
            ))
            .returning();
            
        if (!result || result.length === 0) {
            return NextResponse.json({error: 'Project not found or unauthorized'}, {status: 404});
        }
        
        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}
