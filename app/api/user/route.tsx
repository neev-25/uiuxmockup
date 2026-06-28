import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest)
{
    try {
        const user=await currentUser();

        if(!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({error: 'User not authenticated'}, {status: 401});
        }

        const userEmail = user.primaryEmailAddress.emailAddress;

        const users=await db.select().from(usersTable)
        .where(eq(usersTable.email, userEmail))

        if(users?.length==0)
        {
            const data={
                name:user?.fullName??'',
                email:userEmail
            }
            const result=await db.insert(usersTable).values({
                ...data
            }).returning();
            return NextResponse.json(result[0]);
        }
        return NextResponse.json(users[0]??{})
    } catch(error: any) {
        console.error('Error in /api/user:', error);
        const errorMessage = error?.message || String(error) || 'Internal server error';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}