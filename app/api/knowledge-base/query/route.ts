import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "@/app/lib/knowledge-base";
import OpenAI from 'openai';

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
      openaiApiKey: openAIApiKey,
      namespace: 'tzironis-kb-mistral',
    });

    // Search the knowledge base
    const searchResults = await knowledgeBase.search(query, limit);

    // If no results found
    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any specific information about that from the Tzironis knowledge base. Is there something else you'd like to know?",
        sources: [],
      });
    }

    // Extract the content and sources
    const context = searchResults.map(result => result.pageContent).join("\n\n");
    const sources = searchResults.map(result => {
      // Handle both web and file sources
      if (result.metadata.source === 'web') {
        return {
          url: result.metadata.url,
          title: result.metadata.title,
          similarity: result.similarity,
          type: 'web'
        };
      } else {
        return {
          filename: result.metadata.filename,
          title: result.metadata.title || result.metadata.filename,
          similarity: result.similarity,
          type: 'file'
        };
      }
    });

    // Initialize AI client
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    // Prepare the prompt
    const systemPrompt = `You are a knowledgeable assistant for Tzironis (tzironis.gr). Answer the user's question based ONLY on the following information from the Tzironis knowledge base:

${context}

Provide a concise, helpful, and accurate answer. If the information does not completely answer the question, explain what you know from these sources and what might be missing. Always cite the sources when appropriate.

DO NOT make up or infer information that is not present in the provided context. If you don't know the answer, say so.`;

    // Call AI API to generate the answer
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    // Extract the answer
    const answer = response.choices[0].message.content;

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error: unknown) {
    console.error("Error in knowledge base query API:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 