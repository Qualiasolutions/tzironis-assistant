import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";

export async function POST(req: NextRequest) {
  try {
    const { url, maxPages, maxDepth } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Check if the URL is allowed (only tzironis.gr)
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('tzironis.gr')) {
      return NextResponse.json(
        { error: "Only tzironis.gr domain is allowed" },
        { status: 403 }
      );
    }

    // Get environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const openAIApiKey = process.env.OPENAI_API_KEY;

    // Validate environment variables
    if (!pineconeApiKey || !pineconeIndex || !openAIApiKey) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Initialize knowledge base
    const knowledgeBase = new KnowledgeBase({
      pineconeApiKey,
      pineconeIndex,
      namespace: 'tzironis-kb',
      openaiApiKey: openAIApiKey,
      maxPages: maxPages || 50,
      maxDepth: maxDepth || 3,
    });

    // Start the crawling process
    const result = await knowledgeBase.crawlAndProcess(url);

    return NextResponse.json({
      message: "Crawling completed successfully",
      pagesProcessed: result.pagesProcessed,
      chunksStored: result.chunksStored,
    });
  } catch (error: any) {
    console.error("Error in crawl API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 