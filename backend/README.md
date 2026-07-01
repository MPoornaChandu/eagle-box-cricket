# Backend Notes

This folder organizes backend-facing project material without moving the working Next.js app root.

Current source of truth:

- Supabase schema: `../supabase/schema.sql`
- Environment variable example: `../.env.example`
- Supabase client/storage logic: `../lib/supabase/` and `../lib/storage/`

Suggested future structure:

```text
backend/
  supabase/
    migrations/
    sql/
    seed/
  scripts/
```

Do not commit `.env.local` or service role keys. Only public/publishable Supabase keys should ever be used in browser code.
