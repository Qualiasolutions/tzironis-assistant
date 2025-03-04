import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/app/lib/ai/openai-assistant";
import { createLogger } from "@/app/lib/monitoring/edge-logger";
import { captureException } from "@/app/lib/monitoring/edge-sentry";

const logger = createLogger('chat-api');

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId, language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    
    if (!lastUserMessage || !lastUserMessage.content) {
      return NextResponse.json(
        { error: "Invalid request: no user message found" },
        { status: 400 }
      );
    }
    
    // Prepare language context if needed
    let userContent = lastUserMessage.content;
    if (language !== "en") {
      // Append language preference to the message
      userContent = `[Preferred response language: ${language}] ${userContent}`;
    }
    
    logger.info('Processing chat request', { 
      messageCount: messages.length,
      language,
      hasThreadId: !!threadId
    });
    
    // Return a streaming response
    return streamChat(threadId, userContent);
  } catch (error: unknown) {
    logger.error("Error in chat API", { 
      error: error instanceof Error ? error.message : String(error)
    });
    captureException(error instanceof Error ? error : new Error(String(error)));
    
    const fallbackResponse = {
      role: "assistant",
      content: "I'm sorry, I encountered an error processing your request. Please try again later.",
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    // Return a fallback response instead of an error
    return NextResponse.json(fallbackResponse);
  }
} 