---
name: Supabase RLS notifications INSERT security
description: notifications INSERT WITH CHECK (true) lets any authenticated user forge notifications as arbitrary actors.
---

## Rule
Never use `WITH CHECK (true)` on a notifications INSERT policy. It allows clients to create notifications with any `user_id`, `actor_id`, and `type`, enabling spoofing.

**Why:** The `actor_id` and `user_id` are client-supplied. Without a check, a malicious user can create fake "follow", "like", or "security_login" notifications for any user.

**How to apply:**
- Client path: `WITH CHECK (auth.uid() = actor_id AND auth.uid() IS NOT NULL)` — user can only create notifications where they are the actor.
- Server path: Create notifications inside SECURITY DEFINER trigger functions (like the follower count trigger) — these bypass RLS entirely and are trusted.

This is in `supabase/schema.sql` for Embr.
