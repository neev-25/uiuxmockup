import { db } from "@/config/db";
import { openrouter } from "@/config/openrouter";
import { ScreenConfigTable } from "@/config/schema";
import { APP_LAYOUT_CONFIG_PROMPT, GENERATE_SCREEN_PROMPT } from "@/data/Prompt";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const {projectId,screenId,screenName,purpose,screenDescription,projectVisualDescription}=await req.json()
    const userInput=`
    screen Name is : ${screenName},
    screen Purpose : ${purpose},
    screen Description : ${screenDescription}
    `
    try{
     const aiResult = await openrouter.chat.send({
      // model: "meta-llama/llama-3.1-8b-instruct",
      model:"xiaomi/mimo-v2-flash:free",

        temperature: 0,
      responseFormat:{type:"json_object"},
      messages: [
        {
            role:'system',
            content:[
                {
                    type:'text',
                    text:GENERATE_SCREEN_PROMPT
                }
            ]
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": userInput
            },
          ]
        }
      ],
      stream: false
    });
    const code=aiResult?.choices[0]?.message?.content
    if (!code) {
        return NextResponse.json({error: 'Failed to generate code'}, {status: 500});
    }
    
    const updateResult=await db.update(ScreenConfigTable)
    .set({
        code:code as string
    }).where(and(eq(ScreenConfigTable.projectId,projectId),
    eq(ScreenConfigTable.screenId,screenId as string)))
    .returning()
    
    if (!updateResult || updateResult.length === 0) {
        return NextResponse.json({error: 'Screen not found'}, {status: 404});
    }
    
    return NextResponse.json(updateResult[0]) 
}
catch(e){
    console.error('Error generating screen UI:', e);
    return NextResponse.json({error:'Internal Server Error!', details: e instanceof Error ? e.message : 'Unknown error'}, {status: 500})
}
}