import type { CSSProperties } from './types';
import { serializeStyle } from './css';
import { insertRules } from './sheet';
import { applyLayerToRules, assertOwnLayer } from './layers';
import type { ClassNamingConfig } from './class-naming';

/**
 * Options for `styles.scope()` — a proximity-scoped component override.
 *
 * - `root` — the `@scope` scoping root selector (e.g. `'.theme-acme'`). Rules only
 *   match elements inside the **nearest** such ancestor, so two nested theme regions
 *   overriding the same component are resolved by DOM proximity instead of
 *   stylesheet insertion order.
 * - `to` — optional lower boundary: `@scope (root) to (limit)` stops matching at
 *   the limit selector (exclusive).
 * - `layer` — optional cascade layer name. Requires `createStyles({ layers })`;
 *   the `@scope` rule is wrapped in `@layer` via the same machinery as every
 *   other layered output, so scoped overrides participate in the project's
 *   existing layer stack. Unlike `styles.class` / `styles.component`, `layer`
 *   stays optional on a layered instance — an unlayered override intentionally
 *   beats all layered styles.
 */
export type ScopeOptions<L extends string = string> = {
  root: string;
  to?: string;
  layer?: L;
};

/**
 * Emit a proximity-scoped override for a class name using CSS `@scope`.
 *
 * `overrides` is compiled with the same serializer as `styles.class` /
 * `styles.component`, so pseudo-selectors (`'&:hover'`) and nested at-rules
 * (`'@media …'`) work unchanged; each resulting rule is wrapped in
 * `@scope (root) [to (limit)] { … }` and registered through the normal sheet
 * (deduped, SSR-collected, captured by zero-runtime extraction).
 *
 * Use this only for the nested-theme conflict case — for everything else a
 * plain themed selector (plus a cascade layer) or a component-scoped CSS
 * custom property already wins correctly without `@scope`.
 * Browser support: Chrome 118+, Firefox 128+, Safari 17.4+.
 *
 * @example
 * ```ts
 * styles.scope({ root: '.theme-acme' }, 'button-intent-primary', {
 *   backgroundColor: 'rebeccapurple',
 *   '&:hover': { backgroundColor: 'purple' },
 * });
 * // @scope (.theme-acme) { .button-intent-primary { background-color: rebeccapurple; } }
 * // @scope (.theme-acme) { .button-intent-primary:hover { background-color: purple; } }
 * ```
 */
export function createScope(
  classNaming: ClassNamingConfig,
  opts: ScopeOptions,
  className: string,
  overrides: CSSProperties,
): void {
  const root = typeof opts.root === 'string' ? opts.root.trim() : '';
  if (!root) {
    throw new Error(
      '[typestyles] styles.scope requires a non-empty `root` selector, e.g. { root: ".theme-acme" }.',
    );
  }
  const name = className.trim().replace(/^\./, '').trim();
  if (!name) {
    throw new Error('[typestyles] styles.scope requires a non-empty class name to override.');
  }
  const to = typeof opts.to === 'string' && opts.to.trim() !== '' ? opts.to.trim() : undefined;

  const prelude = `@scope (${root})${to ? ` to (${to})` : ''}`;
  const scoped = serializeStyle(`.${name}`, overrides).map((rule) => ({
    key: `scope:${root}${to ? `:to:${to}` : ''}:${rule.key}`,
    css: `${prelude} {\n${rule.css}\n}`,
  }));

  if (opts.layer != null && opts.layer !== '') {
    if (!classNaming.cascadeLayers) {
      throw new Error(
        `[typestyles] \`layer: "${opts.layer}"\` on styles.scope requires \`createStyles({ layers: [...] })\` — ` +
          'this instance has no cascade layer stack.',
      );
    }
    assertOwnLayer(
      classNaming.cascadeLayers,
      opts.layer,
      `styles.scope({ root: '${root}' }, '${name}', …)`,
    );
    insertRules(applyLayerToRules(scoped, opts.layer, classNaming.cascadeLayers));
    return;
  }

  insertRules(scoped);
}
