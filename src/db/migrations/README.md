# Drizzle Migrations

Migrations are intentionally not generated during T6. The scaffold initialises SQLite directly in `src/db/client.ts` so `npm run dev` can create the database on first boot.

Generate and track formal Drizzle migrations in a later slice once T7 starts writing real schema changes.
