# Qualia AI Assistant

A comprehensive AI assistant for Tzironis (tzironis.gr) that handles website knowledge base, invoice automation, and business lead generation.

## Features

### Website Knowledge Base
- Indexes and provides information from tzironis.gr
- Creates a comprehensive knowledge graph of company information
- Answers queries about products, services, pricing, and more

### Invoice Automation
- Automates invoice creation on union.gr
- Processes natural language commands for invoice generation
- Maintains logs of created invoices

### Business Lead Generation
- Scrapes relevant business directories and platforms
- Extracts and filters contact information
- Formats data in structured formats

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI/ML**: Mistral AI, LangChain
- **Database**: Pinecone (Vector Database)
- **Authentication**: NextAuth.js
- **Web Scraping**: Puppeteer, Cheerio
- **Form Handling**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tzironis/qualia-assistant.git
   cd qualia-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Mistral AI
   MISTRAL_API_KEY=your_mistral_api_key

   # Pinecone
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX=your_pinecone_index

   # NextAuth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000

   # Union.gr (for invoice automation)
   UNION_USERNAME=your_union_username
   UNION_PASSWORD=your_union_password
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure the environment variables
4. Deploy

## Security & Data Handling

- All credentials are securely encrypted
- Session timeouts implemented for invoice system access
- GDPR compliance for lead generation activities
- Clear data retention policies

## License

Proprietary - All rights reserved by Tzironis.

## Contact

For more information, visit [tzironis.gr](https://tzironis.gr).
