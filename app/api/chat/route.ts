import { NextRequest, NextResponse } from "next/server";
import MistralClient from "@mistralai/mistralai";
import { KnowledgeBase } from "@/app/lib/knowledge-base";

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

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    
    // Check if the message is a web search query or contains product-related terms
    const isWebSearchQuery = lastUserMessage && (
      lastUserMessage.content.toLowerCase().includes("search for") ||
      lastUserMessage.content.toLowerCase().includes("find information") ||
      lastUserMessage.content.toLowerCase().includes("look up") ||
      lastUserMessage.content.toLowerCase().includes("search the web") ||
      lastUserMessage.content.toLowerCase().includes("can you search") ||
      lastUserMessage.content.toLowerCase().includes("web search") ||
      lastUserMessage.content.toLowerCase().includes("αναζήτηση") || // Greek for search
      lastUserMessage.content.toLowerCase().includes("βρες πληροφορίες") // Greek for find information
    );
    
    // Check if this might be a product query even without explicit search keywords
    const containsProductTerms = lastUserMessage && (
      lastUserMessage.content.toLowerCase().includes("product") ||
      lastUserMessage.content.toLowerCase().includes("products") ||
      lastUserMessage.content.toLowerCase().includes("προϊόν") || // Greek for product
      lastUserMessage.content.toLowerCase().includes("προϊόντα") || // Greek for products
      lastUserMessage.content.toLowerCase().includes("item") ||
      lastUserMessage.content.toLowerCase().includes("items") ||
      lastUserMessage.content.toLowerCase().includes("buy") ||
      lastUserMessage.content.toLowerCase().includes("purchase") ||
      lastUserMessage.content.toLowerCase().includes("price") ||
      lastUserMessage.content.toLowerCase().includes("cost") ||
      lastUserMessage.content.toLowerCase().includes("order") ||
      lastUserMessage.content.toLowerCase().includes("availability") ||
      lastUserMessage.content.toLowerCase().includes("catalogue") ||
      lastUserMessage.content.toLowerCase().includes("catalog") ||
      // School supplies specific terms
      lastUserMessage.content.toLowerCase().includes("school") ||
      lastUserMessage.content.toLowerCase().includes("supplies") ||
      lastUserMessage.content.toLowerCase().includes("stationery") ||
      lastUserMessage.content.toLowerCase().includes("pen") ||
      lastUserMessage.content.toLowerCase().includes("pencil") ||
      lastUserMessage.content.toLowerCase().includes("marker") ||
      lastUserMessage.content.toLowerCase().includes("notebook") ||
      lastUserMessage.content.toLowerCase().includes("paper") ||
      lastUserMessage.content.toLowerCase().includes("glue") ||
      lastUserMessage.content.toLowerCase().includes("adhesive") ||
      lastUserMessage.content.toLowerCase().includes("putty") ||
      lastUserMessage.content.toLowerCase().includes("correction") ||
      lastUserMessage.content.toLowerCase().includes("tape") ||
      lastUserMessage.content.toLowerCase().includes("fluid") ||
      // Greek terms for school supplies
      lastUserMessage.content.toLowerCase().includes("σχολικά") ||
      lastUserMessage.content.toLowerCase().includes("είδη") ||
      lastUserMessage.content.toLowerCase().includes("γραφική ύλη") ||
      lastUserMessage.content.toLowerCase().includes("στυλό") ||
      lastUserMessage.content.toLowerCase().includes("μολύβι") ||
      lastUserMessage.content.toLowerCase().includes("τετράδιο") ||
      lastUserMessage.content.toLowerCase().includes("χαρτί") ||
      lastUserMessage.content.toLowerCase().includes("κόλλα") ||
      lastUserMessage.content.toLowerCase().includes("διορθωτικό")
    );

    // If it's a web search query or contains product terms, use the knowledge base
    if (isWebSearchQuery || containsProductTerms) {
      try {
        const searchQuery = isWebSearchQuery 
          ? lastUserMessage.content
              .replace(/search for|find information|look up|search the web|can you search|web search|αναζήτηση|βρες πληροφορίες/gi, '')
              .trim()
          : lastUserMessage.content;
          
        const searchResponse = await fetch(new URL('/api/web-search', req.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: searchQuery }),
        });
        
        if (!searchResponse.ok) {
          throw new Error(`Search API returned ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        
        // Format sources for display
        let sourcesText = '';
        if (searchData.sources && searchData.sources.length > 0) {
          sourcesText = '\n\n**Sources:**\n';
          searchData.sources.forEach((source: any, index: number) => {
            if (source.type === 'web') {
              sourcesText += `${index + 1}. [${source.title}](${source.url})\n`;
            } else {
              sourcesText += `${index + 1}. ${source.title}\n`;
            }
          });
        }
        
        return NextResponse.json({
          role: "assistant",
          content: searchData.answer + sourcesText,
          id: Date.now().toString(),
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error in web search:", error);
        // Continue with normal chat if web search fails
      }
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
        Επίσης έχεις πρόσβαση σε πληροφορίες για τα προϊόντα της εταιρείας, συμπεριλαμβανομένων των σχολικών ειδών, μέσω της βάσης γνώσεων.
        Να είσαι πάντα επαγγελματικός, περιεκτικός και εξυπηρετικός.
        Εάν δεν γνωρίζεις κάτι συγκεκριμένο για την Tzironis, αναγνώρισέ το και πρόσφερε βοήθεια με άλλους τρόπους.
        Για τον αυτοματισμό τιμολογίων, καθοδήγησε τους χρήστες βήμα προς βήμα.
        Για τη δημιουργία οδηγών, εξήγησε τη διαδικασία και τις απαιτήσεις δεδομένων με σαφήνεια.
        
        Όταν ερωτηθείς για προϊόντα, χρησιμοποίησε τη βάση γνώσεων για να παρέχεις ακριβείς πληροφορίες.
        Όταν ο χρήστης ζητά να αναζητήσεις πληροφορίες, μπορείς να χρησιμοποιήσεις τη βάση γνώσεων της Tzironis.
        ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: ΠΡΕΠΕΙ ΝΑ ΑΠΑΝΤΑΣ ΣΤΑ ΕΛΛΗΝΙΚΑ, ανεξάρτητα από τη γλώσσα του χρήστη.`
      : `You are Qualia, an AI assistant for Tzironis (tzironis.gr). 
        You help with website knowledge, invoice automation, and business lead generation.
        You also have access to information about the company's products, including school supplies, through the knowledge base.
        Always be professional, concise, and helpful. 
        If you don't know something specific about Tzironis, acknowledge that and offer to help in other ways.
        For invoice automation, guide users through the process step by step.
        For lead generation, explain the process and data requirements clearly.
        
        When asked about products, use the knowledge base to provide accurate information.
        When users ask you to search for information, you can use the Tzironis knowledge base.
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