# Plusarch Upcycle - Eco-Friendly Jewelry E-commerce

A full-stack web application for an eco-friendly jewelry brand featuring customer login, admin panel, live chat, AI chatbot, and more.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **AI**: Pluggable LLM integration (OpenAI-compatible)
- **Validation**: Zod
- **Deployment**: Vercel + Supabase

## Features

- ✅ Customer email OTP authentication
- ✅ Admin panel with role-based access
- ✅ Live chat with realtime messaging
- ✅ AI chatbot with RAG from database
- ✅ Product catalog with categories
- ✅ Inquiry form
- ✅ Gallery management
- ✅ FAQ system
- ✅ Responsive design
- ✅ SEO optimized

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd plusarch-upcycle
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings > API to get your project URL and anon key
4. Go to Settings > Database to get your service role key

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional - for AI chatbot
AI_PROVIDER_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_API_KEY=your_openai_api_key

SITE_URL=http://localhost:3000
```

### 4. Database Setup

Run the migrations and seed data:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Run seed data
supabase db reset
```

### 5. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure Site URL: `http://localhost:3000`
3. Configure Redirect URLs: `http://localhost:3000/auth/callback`
4. Enable Email OTP (Magic Link) provider

### 6. Create Admin User

After setting up the database, you'll need to manually create an admin user:

1. Sign up as a regular user through the app
2. In Supabase SQL Editor, run:

```sql
-- Replace 'user@example.com' with the actual email
INSERT INTO roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-admin-email@example.com';
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase Production Setup

1. Create a production Supabase project
2. Run migrations: `supabase db push`
3. Run seed data: `supabase db reset`
4. Update environment variables with production URLs

## Project Structure

```
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── ...                # Public pages
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   └── ...               # Other utilities
├── supabase/             # Database migrations and seed
└── hooks/                # Custom React hooks
```

## Key Features Implementation

### Authentication

- Email OTP (Magic Link) via Supabase Auth
- Protected routes for logged-in users
- Admin role-based access

### Live Chat

- Realtime messaging using Supabase Realtime
- Admin/operator panel for managing conversations
- Rate limiting and abuse protection

### AI Chatbot

- RAG implementation using Postgres full-text search
- Pluggable LLM provider (OpenAI-compatible)
- Fallback to FAQ snippets when no LLM configured

### Admin Panel

- CRUD operations for products, categories, FAQs
- Inquiry management
- Site settings management
- User moderation tools

## API Routes

- `/api/auth/callback` - Auth callback
- `/api/chat/send` - Send chat message
- `/api/ai/chat` - AI chatbot endpoint
- `/api/inquiry` - Submit inquiry

## Database Schema

See `supabase/migrations/20240123000000_initial_schema.sql` for the complete schema with RLS policies.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
