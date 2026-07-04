---
name: Username-based login with Supabase
description: How to support username login when Supabase auth.users is not accessible from the client.
---

## Rule
Client-side code cannot query `auth.users` directly (it is a protected schema). An RPC like `get_email_by_user_id` requires a SECURITY DEFINER function in the DB schema to exist — if it's missing, username login silently fails.

**Why:** Supabase RLS does not expose `auth.users` to anon/authenticated roles. Without a SECURITY DEFINER function or a denormalized email column, there is no safe client-side path from username → email.

**How to apply (chosen for Embr):**
1. Add an `email TEXT` column to `profiles`.
2. In the `handle_new_user()` trigger, populate it from `NEW.email`.
3. Login screen queries `profiles.email` by username — no special function needed.

**Trade-off:** Email is visible to anyone who can SELECT the row (public profile policy). Mitigate with a column-level view or a SECURITY DEFINER function if email privacy is critical.
