import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";
import MistralClient from "@mistralai/mistralai";

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: "Invalid query" },
        { status: 400 }
      );
    }

    // Get environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
    const pineconeIndex = process.env.PINECONE_INDEX;
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    // Validate environment variables
    if (!pineconeApiKey || !pineconeEnvironment || !pineconeIndex || !openAIApiKey || !mistralApiKey) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Initialize knowledge base
    const knowledgeBase = new KnowledgeBase({
      pineconeApiKey,
      pineconeEnvironment,
      pineconeIndex,
      namespace: 'tzironis-kb',
      openaiApiKey: openAIApiKey,
    });

    // Search the knowledge base
    const searchResults = await knowledgeBase.search(query, limit);

    // If no results found
    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any specific information about that from the Tzironis website. Is there something else you'd like to know?",
        sources: [],
      });
    }

    // Extract the content and sources
    const context = searchResults.map(result => result.pageContent).join("\n\n");
    const sources = searchResults.map(result => ({
      url: result.metadata.url,
      title: result.metadata.title,
      similarity: result.similarity,
    }));

    // Initialize Mistral client
    const mistral = new MistralClient(mistralApiKey);

    // Prepare the prompt
    const systemPrompt = `You are a knowledgeable assistant for Tzironis (tzironis.gr). Answer the user's question based ONLY on the following information from the Tzironis website:

${context}

Provide a concise, helpful, and accurate answer. If the information does not completely answer the question, explain what you know from these sources and what might be missing. Always cite the sources when appropriate.

DO NOT make up or infer information that is not present in the provided context. If you don't know the answer, say so.`;

    // Call Mistral API to generate the answer
    const response = await mistral.chat({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Extract the answer
    const answer = response.choices[0].message.content;

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error: any) {
    console.error("Error in knowledge base query API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 