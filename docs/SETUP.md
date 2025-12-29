# Supabase Setup Guide

This guide will help you set up Supabase for the Matchmaker system.

## Prerequisites

- [Bun](https://bun.sh) installed
- A Supabase account (sign up at [supabase.com](https://supabase.com))

## 1. Install Supabase CLI

```bash
# Using Bun (recommended)
bun install -g supabase

# Or using npm
npm install -g supabase
```

## 2. Initialize Supabase

From the project root:

```bash
supabase init
```

This creates the `supabase/` directory with configuration files.

## 3. Link to Your Supabase Project

### Option A: Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy your project reference ID
4. Link it:

```bash
supabase link --project-ref <your-project-ref>
```

### Option B: Use an Existing Project

```bash
supabase link --project-ref <your-project-ref>
```

## 4. Local Development

### Start Supabase Locally

```bash
supabase start
```

This starts:

- PostgreSQL database (port 54322)
- Supabase Studio (http://localhost:54323)
- API Gateway
- Auth server
- Realtime server

### Apply Migrations

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` to your local database.

### Access Local Studio

Open [http://localhost:54323](http://localhost:54323) to access the Supabase Studio interface.

### Stop Supabase

```bash
supabase stop
```

## 5. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Local Development

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>
```

You can find the local keys by running:

```bash
supabase status
```

### Production

```bash
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
```

Find production keys in your [Supabase Dashboard](https://supabase.com/dashboard) under Settings > API.

## 6. Database Schema

The initial migration creates two tables:

### matchmakers

Extends `auth.users` with matchmaker-specific information.

- `id` - UUID (references auth.users)
- `name` - VARCHAR(255)
- `created_at` - TIMESTAMP WITH TIME ZONE

### people

Stores people in the matchmaking network.

- `id` - UUID (primary key)
- `matchmaker_id` - UUID (references matchmakers)
- `name` - VARCHAR(255)
- `created_at` - TIMESTAMP WITH TIME ZONE

### Row Level Security (RLS)

Both tables have RLS enabled:

- **matchmakers**: Users can only view their own profile
- **people**: Matchmakers can only view/edit people they manage

## 7. Migration Commands

### Create a New Migration

```bash
supabase migration new <migration-name>
```

### Apply Migrations Locally

```bash
supabase db reset
```

### Apply Migrations to Production

```bash
supabase db push
```

### View Migration Status

```bash
supabase migration list
```

## 8. Deploying to Production

1. Ensure all migrations are committed to git
2. Link to your production project (if not already linked)
3. Push migrations:

```bash
supabase db push
```

4. Verify in the Supabase Dashboard

## 9. Creating Your First Matchmaker

Matchmaker profiles must be created manually. After a user signs up via Supabase Auth:

1. Get their `user_id` from `auth.users`
2. Insert a record into `matchmakers`:

```sql
INSERT INTO matchmakers (id, name)
VALUES ('<user-id>', 'Matchmaker Name');
```

Or use your backend API to handle this automatically after signup.

## Troubleshooting

### Reset Local Database

```bash
supabase db reset
```

### View Logs

```bash
supabase logs
```

### Check Database Status

```bash
supabase status
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
