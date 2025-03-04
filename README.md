# Tzironis Business Suite

A unified AI-powered business assistant that integrates knowledge base, lead generation, and invoice automation capabilities.

## Features

- OpenAI Assistant integration with thread persistence
- Knowledge base for business questions
- Automated lead generation
- Invoice automation through Union.gr
- Web crawling for up-to-date information

## Environment Setup

1. Copy `.env.local.example` to `.env.local` and fill in your API keys:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `OPENAI_ASSISTANT_ID` - Your OpenAI Assistant ID (created in the OpenAI platform)
   - `PINECONE_API_KEY` - Your Pinecone API key for vector storage
   - Other relevant credentials (Union.gr login, etc.)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment Instructions

### Deploying to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add all environment variables from `.env.local` to Vercel's environment variables
4. Deploy with the following settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

Vercel offers the best integration with Next.js and handles serverless functions automatically.

### Deploying to Netlify

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Add all environment variables from `.env.local` to Netlify's environment variables
4. Deploy with the following settings:
   - Build Command: `npm run build`
   - Publish Directory: `.next`
   - Functions Directory: `netlify/functions`

Note: You'll need to set up Netlify Functions for the API routes.

### Deploying to Render

1. Push your code to GitHub
2. Create a new Web Service in Render connected to your GitHub repository
3. Add all environment variables from `.env.local`
4. Set up the service with:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Deploying to Railway

1. Push your code to GitHub
2. Create a new project in Railway from your GitHub repository
3. Add all environment variables from `.env.local`
4. The service will automatically detect the Next.js project and configure it

## Recommendation

**Vercel** is the recommended deployment platform for this project because:

1. It's built specifically for Next.js applications
2. It handles serverless API routes seamlessly
3. It offers excellent performance and reliability
4. Free tier is generous for most small-to-medium businesses
5. Environment variables are simple to manage
6. The deployment process is straightforward and reliable

## After Deployment

1. Update your `NEXTAUTH_URL` environment variable to match your production URL
2. Set up proper authentication for production
3. Create a recurring task to crawl your website and update the knowledge base

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

## Security & Data Handling

- All credentials are securely encrypted
- Session timeouts implemented for invoice system access
- GDPR compliance for lead generation activities
- Clear data retention policies

## License

Proprietary - All rights reserved by Tzironis.

## Contact

For more information, visit [tzironis.gr](https://tzironis.gr).
