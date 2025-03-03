import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";

// Add configuration to prevent this from running at build time
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    // Get environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    // Validate environment variables
    if (!pineconeApiKey || !pineconeIndex || !mistralApiKey) {
      console.warn("Knowledge base API: Missing required environment variables");
      return NextResponse.json(
        { sources: [], status: "config_missing" },
        { status: 200 }
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
    
    console.log(`Knowledge base API: Successfully retrieved ${sources.sources.length} sources`);
    return NextResponse.json({
      ...sources,
      status: "success"
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in knowledge base sources API: ${errorMessage}`, {
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Instead of returning an error, return an empty array with error status
    return NextResponse.json(
      { 
        sources: [],
        status: "error",
        message: "Failed to retrieve knowledge base sources"
      },
      { status: 200 }
    );
  }
} 