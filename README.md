# JurnalStar - AI-Powered Research Platform

JurnalStar is a modern platform designed to revolutionize the way researchers find, read, and understand academic papers.

## Features
- **Semantic Search**: Search millions of journals via Semantic Scholar API.
- **AI Summaries**: Get instant, easy-to-understand summaries of complex research papers.
- **AI PDF Reader**: Read papers in a custom viewer with an integrated AI research assistant.
- **Premium UI**: Modern dark-themed interface built with Next.js, Tailwind, and Framer Motion.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Create a `.env.local` file and add your keys:
   ```env
   OPENAI_API_KEY=your_key
   DATABASE_URL=your_db_url
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Radix UI.
- **AI**: OpenAI GPT-4o-mini.
- **Search**: Semantic Scholar API.
- **Database**: Prisma + PostgreSQL.
