---
'typestyles': minor
---

Add `atProperty` presets (`atProperty.color`, `atProperty.angle`, etc.) for spreadable `@property` registration metadata across tokens, components, styles, and `typestyles/css`.

Add `typestyles/css` subpath with `css.atProperty`, `css.customProperty`, `css.customProperties`, and `css.var` for exact-name CSS custom property control.

Add `styles.property.declare` / `styles.property.set` and `ctx.vars.declare` / `ctx.var.declare` for split `@property` registration and value assignment. Shorthand `styles.property(id, options?)` and `ctx.vars(definitions)` behavior is unchanged.

Export `PropertyRegistration`, `PropertyRef`, and `PropertyOptions` types. `TokenDescriptor` and `RegisteredPropertyOptions` are deprecated aliases.
