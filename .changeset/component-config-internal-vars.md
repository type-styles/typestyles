---
'typestyles': minor
---

Add function overload for `styles.component(namespace, (ctx) => config)` with component-scoped internal custom properties: `ctx.var(id, options?)` and `ctx.vars(definitions)` using the same nested shape as tokens (string/number leaves or `{ value, syntax?, inherits? }`). Default `value`s are merged into `base`; optional `syntax` registers `@property`. `ctx.var` now takes `value` (not `initialValue`) for defaults and typed registration. New exports: `ComponentConfigContext`, `ComponentVarDefinitions`, `ComponentVarDescriptor`, `ComponentVarNode`, `ComponentVarRefTree`, and related `*Input` types for the component overload.
