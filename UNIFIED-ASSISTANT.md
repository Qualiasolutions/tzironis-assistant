# Unified OpenAI Assistant for Tzironis Business Suite

This document explains how to set up and use the unified OpenAI Assistant feature in the Tzironis Business Suite, which combines knowledge base, lead generation, and Union.gr invoice automation in one powerful solution.

## Overview

The unified assistant uses OpenAI's Assistants API to provide a comprehensive solution that:

1. **Knowledge Base Integration**: Automatically searches and retrieves information from your company data
2. **Lead Generation**: Generates business leads based on specified criteria
3. **Invoice Automation**: Creates invoices on Union.gr through automated browser interactions

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file based on the `.env.local.example` template with the following key variables:

```
# OpenAI - Required for unified assistant
OPENAI_API_KEY=your-openai-api-key
OPENAI_ASSISTANT_ID= # Optional: Your pre-created assistant ID

# Union.gr (for invoice automation)
UNION_USERNAME=your_union_username
UNION_PASSWORD=your_union_password

# Pinecone - Required for knowledge base
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=your-pinecone-index
PINECONE_HOST=your-pinecone-host
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build and Start the Application

```bash
npm run build
npm start
```

## Usage Guide

### Knowledge Base Queries

Your assistant can answer questions about your business using the knowledge base:

Example queries:
- "What products does Tzironis offer?"
- "Tell me about your school supplies"
- "What are your business hours?"

### Lead Generation

Generate business leads by specifying criteria:

Example queries:
- "Generate 5 leads from the technology industry"
- "Find potential clients in the education sector"
- "Create a list of retail businesses I could contact"

### Invoice Automation

Create invoices on Union.gr automatically:

Example queries:
- "Create an invoice for ABC Company with VAT EL123456789 for 10 hours of consulting at €100 per hour"
- "Generate a new invoice for XYZ Ltd for the following items: 5 notebooks at €10 each, 10 pens at €2 each"

## Conversation Persistence

The assistant remembers the context of your conversations using OpenAI's thread system. The `threadId` is returned in responses and should be sent in subsequent requests to maintain context.

## Customization

### Modifying the Assistant

The assistant is created in `app/lib/ai/openai-assistant.ts`. You can customize:

1. **Instructions**: Edit the instructions to change how the assistant responds
2. **Model**: Change the model (default is gpt-4o)
3. **Tools**: Add or modify the tool definitions for different capabilities

### Adding New Capabilities

To add new capabilities:

1. Define a new tool in the `getOrCreateAssistant` function
2. Implement the tool handler in the `handleToolCalls` function
3. Create the corresponding API endpoint

## Troubleshooting

Common issues:

1. **Assistant creation fails**: Check your OpenAI API key and permissions
2. **Knowledge base not working**: Verify Pinecone configuration and data indexing
3. **Invoice automation fails**: 
   - Check Union.gr credentials
   - Make sure the puppeteer installation is working correctly
   - Verify element selectors are up-to-date with Union.gr's interface

## Security Considerations

- Store all credentials securely using environment variables
- Consider implementing IP restrictions for invoice automation endpoints
- Add proper logging for audit trails
- Use server-side rate limiting to prevent abuse

## Monitoring and Maintenance

- Review OpenAI usage regularly to manage costs
- Check Union.gr integration whenever their interface changes
- Update the knowledge base regularly with new information 