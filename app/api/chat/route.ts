import { NextRequest, NextResponse } from "next/server";
import MistralClient from "@mistralai/mistralai";

// Initialize the AI client
const client = new MistralClient(process.env.MISTRAL_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages, language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    // Format messages for AI
    const formattedMessages = messages.map((message: any) => ({
      role: message.role,
      content: message.content,
    }));

    // Add system message with context about Tzironis and language preference
    const systemPrompt = language === "el" 
      ? `Είσαι η Qualia, ένας βοηθός AI για την Tzironis (tzironis.gr).
        Βοηθάς με τη γνώση του ιστότοπου, τον αυτοματισμό τιμολογίων και τη δημιουργία επιχειρηματικών οδηγών.
        Να είσαι πάντα επαγγελματικός, περιεκτικός και εξυπηρετικός.
        Εάν δεν γνωρίζεις κάτι συγκεκριμένο για την Tzironis, αναγνώρισέ το και πρόσφερε βοήθεια με άλλους τρόπους.
        Για τον αυτοματισμό τιμολογίων, καθοδήγησε τους χρήστες βήμα προς βήμα.
        Για τη δημιουργία οδηγών, εξήγησε τη διαδικασία και τις απαιτήσεις δεδομένων με σαφήνεια.
        ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: ΠΡΕΠΕΙ ΝΑ ΑΠΑΝΤΑΣ ΣΤΑ ΕΛΛΗΝΙΚΑ, ανεξάρτητα από τη γλώσσα του χρήστη.`
      : `You are Qualia, an AI assistant for Tzironis (tzironis.gr). 
        You help with website knowledge, invoice automation, and business lead generation.
        Always be professional, concise, and helpful. 
        If you don't know something specific about Tzironis, acknowledge that and offer to help in other ways.
        For invoice automation, guide users through the process step by step.
        For lead generation, explain the process and data requirements clearly.
        VERY IMPORTANT: YOU MUST RESPOND IN ENGLISH, regardless of the user's language.`;

    const systemMessage = {
      role: "system",
      content: systemPrompt,
    };

    // Add system message at the beginning
    formattedMessages.unshift(systemMessage);

    // Call AI API
    const response = await client.chat({
      model: "mistral-large-latest",
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Extract the assistant's response
    const assistantResponse = response.choices[0].message;
    
    // Ensure we always have content
    if (!assistantResponse.content || assistantResponse.content.trim() === "") {
      return NextResponse.json({
        role: "assistant",
        content: "I'm sorry, I couldn't generate a response. Please try again.",
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: assistantResponse.content,
      id: Date.now().toString(),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    
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