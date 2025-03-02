import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import MistralClient from "@mistralai/mistralai";

// Initialize the AI client for embeddings
const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY || "");

// Sample website content for demo purposes
// In a real implementation, this would be stored in Pinecone vector DB
const SAMPLE_CONTENT = [
  {
    id: "page-1",
    url: "/services",
    title: "Tzironis Business Services",
    content: "We provide comprehensive business services including consulting, digital transformation, and process optimization. Our team of experts works closely with clients to understand their unique challenges and deliver tailored solutions.",
    type: "page",
    lastCrawled: new Date(),
  },
  {
    id: "page-2",
    url: "/about",
    title: "About Tzironis",
    content: "Tzironis is a leading business solutions provider with over 10 years of experience in helping companies optimize their operations. Founded in 2013, we've worked with hundreds of clients across various industries.",
    type: "page",
    lastCrawled: new Date(),
  },
  {
    id: "page-3",
    url: "/contact",
    title: "Contact Information",
    content: "Get in touch with our team at info@tzironis.gr or call us at +30 123 456 7890. Our office is located at 123 Business Street, Athens, Greece.",
    type: "page",
    lastCrawled: new Date(),
  },
  {
    id: "service-1",
    url: "/services/consulting",
    title: "Business Consulting",
    content: "Our business consulting services help organizations improve their performance and efficiency. We analyze current problems and develop plans for improvement.",
    type: "service",
    lastCrawled: new Date(),
  },
  {
    id: "service-2",
    url: "/services/digital-transformation",
    title: "Digital Transformation",
    content: "We help businesses adopt digital technology to transform their services and operations. Our approach focuses on both technology implementation and cultural change.",
    type: "service",
    lastCrawled: new Date(),
  },
];

export async function GET(req: NextRequest) {
  try {
    // Get search parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const type = searchParams.get("type");
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }
    
    // 1. Generate embedding for the query using advanced AI
    // 2. Perform a vector search in Pinecone
    // 3. Return the most relevant results
    
    // For this demo, we'll perform a simple text search on our sample data
    let results = SAMPLE_CONTENT.filter((item) => {
      const contentMatches = item.content.toLowerCase().includes(query.toLowerCase());
      const titleMatches = item.title.toLowerCase().includes(query.toLowerCase());
      return contentMatches || titleMatches;
    });
    
    // Apply type filter if provided
    if (type) {
      results = results.filter((item) => item.type === type);
    }
    
    // Sort by relevance (very basic for demo)
    results.sort((a, b) => {
      const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
      const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
      return bScore - aScore;
    });
    
    // Add snippet for each result
    const processedResults = results.map((item) => {
      // Generate a simple snippet (in a real implementation this would be more sophisticated)
      let snippet = item.content;
      if (snippet.length > 150) {
        snippet = snippet.substring(0, 150) + "...";
      }
      
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        snippet,
        type: item.type,
      };
    });
    
    return NextResponse.json({ results: processedResults });
  } catch (error) {
    console.error("Error in knowledge base search:", error);
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint would be used for more complex queries or filtering
    const { query, filters } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }
    
    // For this demo, we'll perform a simple text search on our sample data
    let results = SAMPLE_CONTENT.filter((item) => {
      const contentMatches = item.content.toLowerCase().includes(query.toLowerCase());
      const titleMatches = item.title.toLowerCase().includes(query.toLowerCase());
      return contentMatches || titleMatches;
    });
    
    // Apply filters if provided
    if (filters?.type) {
      results = results.filter((item) => item.type === filters.type);
    }
    
    if (filters?.url) {
      results = results.filter((item) => item.url.includes(filters.url));
    }
    
    // Add snippet for each result
    const processedResults = results.map((item) => {
      // Generate a simple snippet
      let snippet = item.content;
      if (snippet.length > 150) {
        snippet = snippet.substring(0, 150) + "...";
      }
      
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        snippet,
        type: item.type,
      };
    });
    
    return NextResponse.json({ results: processedResults });
  } catch (error) {
    console.error("Error in knowledge base search:", error);
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 }
    );
  }
} 