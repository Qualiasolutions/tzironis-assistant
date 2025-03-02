import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";

export async function GET(req: NextRequest) {
  try {
    // Get environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    // Validate environment variables
    if (!pineconeApiKey || !pineconeIndex || !mistralApiKey) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Initialize knowledge base
    const knowledgeBase = new KnowledgeBase({
      pineconeApiKey,
      pineconeIndex,
      openaiApiKey: openAIApiKey,
      mistralApiKey,
      namespace: 'tzironis-kb-mistral',
    });

    // List sources
    const sources = await knowledgeBase.listSources();

    return NextResponse.json(sources);
  } catch (error: any) {
    console.error("Error in knowledge base sources API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 