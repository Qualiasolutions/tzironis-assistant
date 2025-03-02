import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";
import { getServerSession } from "next-auth";

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication (only admins should be able to clear the KB)
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const adminUsername = process.env.ADMIN_USERNAME;

    // Validate environment variables
    if (!pineconeApiKey || !pineconeIndex || !mistralApiKey) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Verify admin privileges
    if (session.user.email !== adminUsername) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
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

    // Clear all documents
    await knowledgeBase.clearAll();

    return NextResponse.json({
      message: "Knowledge base cleared successfully"
    });
  } catch (error: any) {
    console.error("Error clearing knowledge base:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 