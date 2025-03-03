import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if required environment variables are set
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    
    const missingVars = [];
    if (!pineconeApiKey) missingVars.push("PINECONE_API_KEY");
    if (!pineconeIndex) missingVars.push("PINECONE_INDEX");
    if (!mistralApiKey) missingVars.push("MISTRAL_API_KEY");
    
    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          status: "warning", 
          message: "Application running but missing environment variables", 
          missingVars 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { 
        status: "healthy", 
        message: "Application is running correctly",
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: "error", 
        message: error.message || "Internal server error" 
      },
      { status: 500 }
    );
  }
}