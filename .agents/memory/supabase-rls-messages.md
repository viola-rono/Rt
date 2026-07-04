---
name: Supabase RLS messages INSERT security
description: Critical RLS gap — messages INSERT must verify the sender is actually a participant in the conversation.
---

## Rule
A `messages` INSERT policy that only checks `auth.uid() = sender_id` is insufficient. Any authenticated user who knows (or guesses) a conversation UUID can inject messages.

**Why:** The `conversation_id` is a foreign key the client supplies. Without verifying membership, broken-object-level-authorization is trivially exploitable.

**How to apply:**
```sql
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
);
```
This is in `supabase/schema.sql` for Embr.
