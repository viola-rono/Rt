---
name: Expo Router modal back-params
description: Why router.setParams() after router.back() breaks in Expo Router modal sub-screens, and the correct fix.
---

## Rule
Never use `router.back(); router.setParams(...)` to pass data from a child modal back to a parent screen in Expo Router. The params do not reliably reach the parent screen instance.

**Why:** In Expo Router, `setParams` sets params on the *current* route. After `router.back()`, the current route has changed; the call lands on the wrong screen or is dropped entirely.

**How to apply:** When a sub-screen (e.g. create-post/feeling, create-post/location) needs to hand data back to a parent:
1. Create a shared React context (e.g. `CreatePostContext`) wrapping the relevant stack.
2. The sub-screen calls the context setter, then `router.back()`.
3. The parent reads from context — values are always current.

This pattern is already implemented in `contexts/CreatePostContext.tsx` for the Embr create-post flow.
