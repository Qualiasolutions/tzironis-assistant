import OpenAI from 'openai';
import { captureException } from '../monitoring/sentry';
import { createLogger } from '../monitoring/logger';

const logger = createLogger('openai-assistant');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache assistant ID to avoid recreating
let cachedAssistantId: string | null = null;

// Main Assistant ID from environment or use cached version
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || null;

/**
 * Get or create the universal assistant
 */
export async function getOrCreateAssistant() {
  // Use existing assistant if specified in env
  if (ASSISTANT_ID) {
    try {
      const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
      return assistant;
    } catch (error: unknown) {
      logger.error('Failed to retrieve existing assistant', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      captureException(error instanceof Error ? error : new Error(String(error)));
      // Fall through to creation
    }
  }

  // Use cached assistant if available
  if (cachedAssistantId) {
    try {
      const assistant = await openai.beta.assistants.retrieve(cachedAssistantId);
      return assistant;
    } catch (error: unknown) {
      logger.error('Failed to retrieve cached assistant', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      captureException(error instanceof Error ? error : new Error(String(error)));
      cachedAssistantId = null;
      // Fall through to creation
    }
  }

  // Create a new assistant
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Tzironis Business Suite Assistant",
      description: "Unified assistant for Tzironis business needs including knowledge base, lead generation, and invoice automation",
      model: "gpt-4o-mini",
      instructions: `You are a helpful AI assistant for Tzironis Business Suite. You have multiple capabilities:

1. You can answer questions about Tzironis's business, products, and services using the Knowledge Base.
2. You can generate business leads based on criteria like industry, location, and source.
3. You can automate invoice creation by logging into Union.gr and creating invoices with the provided details.

When helping users:
- For knowledge base queries: Use relevant knowledge from your training and the retrieval tool.
- For lead generation: Help identify potential leads based on user criteria.
- For invoice automation: Collect the necessary information (client, items, prices) and create the invoice through Union.gr.

Always be professional, concise, and helpful. If you're uncertain about capabilities, explain what you can do clearly.
      `,
      tools: [
        // Knowledge Base Search Tool
        {
          type: "file_search" as const,
        },
        // Lead Generation Tool
        {
          type: "function" as const,
          function: {
            name: "generateLeads",
            description: "Generate business leads based on provided criteria",
            parameters: {
              type: "object",
              properties: {
                industry: {
                  type: "string",
                  description: "The industry to target for lead generation",
                },
                source: {
                  type: "string",
                  description: "The source to use for finding leads (e.g., 'web', 'directory', 'association')",
                },
                count: {
                  type: "integer",
                  description: "Number of leads to generate (default: 5)",
                }
              },
              required: ["source"]
            }
          }
        },
        // Union.gr Invoice Creation
        {
          type: "function",
          function: {
            name: "createUnionInvoice",
            description: "Create an invoice on Union.gr",
            parameters: {
              type: "object",
              properties: {
                clientName: {
                  type: "string",
                  description: "Full name of the client"
                },
                clientVat: {
                  type: "string",
                  description: "VAT number of the client"
                },
                clientAddress: {
                  type: "string",
                  description: "Address of the client"
                },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                        description: "Description of the product or service"
                      },
                      quantity: {
                        type: "number",
                        description: "Quantity of the product or service"
                      },
                      unitPrice: {
                        type: "number",
                        description: "Price per unit of the product or service"
                      }
                    },
                    required: ["description", "quantity", "unitPrice"]
                  },
                  description: "Array of invoice items"
                }
              },
              required: ["clientName", "clientVat", "items"]
            }
          }
        }
      ]
    });

    // Cache the assistant ID
    cachedAssistantId = assistant.id;
    logger.info('Created new assistant', { assistantId: assistant.id });
    
    return assistant;
  } catch (error) {
    logger.error('Failed to create assistant', { error });
    captureException(error);
    throw error;
  }
}

/**
 * Create a thread for communication
 */
export async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id;
  } catch (error: unknown) {
    logger.error('Failed to create thread', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    captureException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Add a message to a thread
 */
export async function addMessageToThread(threadId: string, content: string, role: 'user' | 'assistant' = 'user') {
  try {
    const message = await openai.beta.threads.messages.create(
      threadId,
      {
        role,
        content,
      }
    );
    return message;
  } catch (error) {
    logger.error('Failed to add message to thread', { threadId, error });
    captureException(error);
    throw error;
  }
}

/**
 * Run the assistant on a thread
 */
export async function runAssistant(threadId: string, assistantId?: string) {
  try {
    // Get or create assistant if not provided
    let finalAssistantId = assistantId;
    if (!finalAssistantId) {
      const assistant = await getOrCreateAssistant();
      finalAssistantId = assistant.id;
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: finalAssistantId,
      }
    );
    
    return run;
  } catch (error) {
    logger.error('Failed to run assistant', { threadId, error });
    captureException(error);
    throw error;
  }
}

/**
 * Check the status of a run
 */
export async function checkRunStatus(threadId: string, runId: string) {
  try {
    const run = await openai.beta.threads.runs.retrieve(
      threadId,
      runId
    );
    return run;
  } catch (error) {
    logger.error('Failed to check run status', { threadId, runId, error });
    captureException(error);
    throw error;
  }
}

/**
 * Handle tool calls for a run that requires action
 */
export async function handleToolCalls(threadId: string, runId: string, toolCalls: any[]) {
  try {
    const toolOutputs = [];

    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "generateLeads") {
        // Handle lead generation
        const args = JSON.parse(toolCall.function.arguments);
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        
        const result = await response.json();
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(result)
        });
      } 
      else if (toolCall.function.name === "createUnionInvoice") {
        // Handle invoice creation
        const args = JSON.parse(toolCall.function.arguments);
        
        try {
          // Use our existing invoice automation API
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/invoices/union`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          
          const result = await response.json();
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(result)
          });
        } catch (error) {
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify({ 
              error: true, 
              message: error instanceof Error ? error.message : "Failed to create invoice" 
            })
          });
        }
      }
    }

    // Submit tool outputs back to the assistant
    if (toolOutputs.length > 0) {
      const runResult = await openai.beta.threads.runs.submitToolOutputs(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      return runResult;
    }

    return null;
  } catch (error) {
    logger.error('Failed to handle tool calls', { threadId, runId, error });
    captureException(error);
    throw error;
  }
}

/**
 * Get all messages from a thread
 */
export async function getMessages(threadId: string, limit: number = 10) {
  try {
    const messages = await openai.beta.threads.messages.list(
      threadId,
      { limit }
    );
    
    return messages.data;
  } catch (error) {
    logger.error('Failed to get messages', { threadId, error });
    captureException(error);
    throw error;
  }
}

/**
 * Complete unified chat function that handles the entire flow
 */
export async function handleChat(threadId: string | null, userMessage: string) {
  try {
    // Create a new thread if none exists
    const currentThreadId = threadId || await createThread();
    
    // Add user message to thread
    await addMessageToThread(currentThreadId, userMessage);
    
    // Run the assistant
    const assistant = await getOrCreateAssistant();
    const run = await runAssistant(currentThreadId, assistant.id);
    
    // Poll for completion
    let runStatus = await checkRunStatus(currentThreadId, run.id);
    let attempts = 0;
    const maxAttempts = 60; // Maximum 5 minutes (60 x 5s)
    
    while (
      runStatus.status !== "completed" && 
      runStatus.status !== "failed" && 
      runStatus.status !== "cancelled" && 
      attempts < maxAttempts
    ) {
      // Handle tool calls if needed
      if (runStatus.status === "requires_action") {
        const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls || [];
        await handleToolCalls(currentThreadId, run.id, toolCalls);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check status again
      runStatus = await checkRunStatus(currentThreadId, run.id);
      attempts++;
    }
    
    if (runStatus.status !== "completed") {
      throw new Error(`Assistant run did not complete. Status: ${runStatus.status}`);
    }
    
    // Get the latest message from the assistant
    const messages = await getMessages(currentThreadId, 1);
    const assistantMessage = messages.find(msg => msg.role === "assistant");
    
    if (!assistantMessage) {
      throw new Error("No assistant message found after completion");
    }
    
    return {
      threadId: currentThreadId,
      message: assistantMessage.content[0]?.text?.value || "Sorry, I couldn't generate a response.",
      status: runStatus.status
    };
  } catch (error) {
    logger.error('Error in handleChat', { error });
    captureException(error);
    throw error;
  }
} 