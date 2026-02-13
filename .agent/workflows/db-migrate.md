---
description: How to run database migrations against Supabase
---

# Running Database Migrations

## Prerequisites

You need `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file.

Find it at: **Supabase Dashboard → Settings → API → service_role key** (the secret one, not the anon key).

Add this line to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Running Migrations

### Run ALL migration files (from `supabase/migrations/`):
// turbo
```bash
npm run db:migrate
```

### Run a SPECIFIC migration file:
```bash
npm run db:migrate:file -- supabase/migrations/admin_enhancements.sql
```

## Creating New Migrations

1. Create a new `.sql` file in `supabase/migrations/`:
   ```
   supabase/migrations/my_new_feature.sql
   ```

2. Write your SQL (ALTER TABLE, CREATE INDEX, etc.)

3. Also update `supabase/schema.sql` to keep the canonical schema in sync.

4. Update TypeScript types in `src/types/database.ts` to match.

5. Run the migration:
   ```bash
   npm run db:migrate:file -- supabase/migrations/my_new_feature.sql
   ```

## Troubleshooting

- **"SUPABASE_SERVICE_ROLE_KEY not found"**: Add it to `.env.local`
- **"SQL execution failed"**: Check your SQL syntax. The script tries multiple Supabase API endpoints.
- **Permission errors**: Make sure you're using the service_role key, not the anon key.
