---
'typestyles': patch
---

Fix `styles.class()` throwing when the same class name is registered twice in one process — e.g. meta-frameworks with multiple server module graphs in a single process (the Vite Environment API, or RSC frameworks like Waku/Vocs) re-evaluate the same source module once per environment, which previously crashed SSR with `[typestyles] styles.class('name', ...) was called more than once for scope '...'`.

In development, `styles.class()` now matches the re-registration behavior `styles.component()` already had: it invalidates the previous rule(s) for that class and re-registers instead of throwing (the same trade-off already made for HMR / out-of-order `dispose` re-execution). Production behavior is unchanged — it never threw there.

Also fixes a related bug in the shared HMR invalidation path (`invalidateKeys` / `invalidatePrefix`, used by both `styles.class()` and `styles.component()`): re-registering before the prior registration's CSS had flushed left the stale CSS text queued alongside the new CSS, producing a duplicate, conflicting rule once flushed.
