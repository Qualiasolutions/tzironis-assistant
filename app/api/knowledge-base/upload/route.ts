import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";

// Next.js App Router configuration
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

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

    // Process the file
    const filename = file.name;
    const fileType = file.type;
    const content = await file.text();

    // Only process if file has content
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "File is empty or too small" },
        { status: 400 }
      );
    }

    // Add to knowledge base
    const result = await knowledgeBase.processFile(filename, content, fileType);

    return NextResponse.json({
      message: "File processed successfully",
      ...result
    });
  } catch (error: any) {
    console.error("Error in file upload API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 