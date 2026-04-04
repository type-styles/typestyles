import type {
  ThemeCondition,
  ThemeConditionMedia,
  ThemeConditionAttr,
  ThemeConditionClass,
  ThemeConditionSelector,
  ThemeConditionAnd,
  ThemeConditionOr,
  ThemeConditionNot,
  ThemeConfig,
  ThemeModeDefinition,
  ThemeOverrides,
  ThemeSurface,
  TokenValues,
} from './types.js';
import { flattenTokenEntries } from './types.js';
import { sanitizeClassSegment, scopedTokenNamespace } from './class-naming.js';
import { insertRule, insertRules } from './sheet.js';

// ---------------------------------------------------------------------------
// Condition builders — tokens.when.*
// ---------------------------------------------------------------------------

function condMedia(query: string): ThemeConditionMedia {
  return { type: 'media', query };
}

function condAttr(
  name: string,
  value: string,
  opts: { scope: 'self' | 'ancestor' },
): ThemeConditionAttr {
  return { type: 'attr', name, value, scope: opts.scope };
}

function condClassName(name: string, opts: { scope: 'self' | 'ancestor' }): ThemeConditionClass {
  return { type: 'class', name, scope: opts.scope };
}

function condSelector(selector: string): ThemeConditionSelector {
  if (process.env.NODE_ENV !== 'production') {
    validateSelector(selector);
  }
  return { type: 'selector', selector };
}

function condAnd(...conditions: ThemeCondition[]): ThemeConditionAnd {
  return { type: 'and', conditions };
}

function condOr(...conditions: ThemeCondition[]): ThemeConditionOr {
  return { type: 'or', conditions };
}

/**
 * Negate a condition. Double negation is folded (`not(not(x))` → `x`).
 *
 * Supported inner shapes (single CSS branch after compile):
 * - `when.media` / `when.prefersDark` / `when.prefersLight` → `@media not (…)`
 * - `when.attr` / `when.className` with `scope: 'self'` → `:not(…)` on the theme class
 * - `when.attr` / `when.className` with `scope: 'ancestor'` → `:root:not(…) .theme-*` (intended when state lives on `html` / `:root`)
 *
 * Not supported: `when.selector`, `when.or`, combined `@media` + selector, or both ancestor and self selector parts on the same branch. Those log a dev warning and emit no rule.
 */
function condNot(condition: ThemeCondition): ThemeCondition {
  if (condition.type === 'not') {
    return condition.condition;
  }
  return { type: 'not', condition };
}

/**
 * Condition builders for theme mode layers.
 *
 * @example
 * ```ts
 * tokens.when.prefersDark
 * tokens.when.media('(prefers-color-scheme: dark)')
 * tokens.when.attr('data-color-mode', 'dark', { scope: 'ancestor' })
 * tokens.when.or(tokens.when.prefersDark, tokens.when.attr('data-mode', 'dark', { scope: 'self' }))
 * ```
 */
export const when = {
  media: condMedia,
  attr: condAttr,
  className: condClassName,
  selector: condSelector,
  and: condAnd,
  or: condOr,
  not: condNot,
  /** Shorthand for `when.media('(prefers-color-scheme: dark)')`. */
  prefersDark: { type: 'media', query: '(prefers-color-scheme: dark)' } as ThemeConditionMedia,
  /** Shorthand for `when.media('(prefers-color-scheme: light)')`. */
  prefersLight: { type: 'media', query: '(prefers-color-scheme: light)' } as ThemeConditionMedia,
} as const;

// ---------------------------------------------------------------------------
// Dev-only selector validation (lightweight heuristics)
// ---------------------------------------------------------------------------

function validateSelector(selector: string): void {
  if (!selector || !selector.trim()) {
    console.warn(
      '[typestyles] when.selector() received an empty string. This will produce an invalid CSS rule.',
    );
    return;
  }

  if (selector.includes('!important')) {
    console.warn(
      '[typestyles] when.selector() contains "!important" — this belongs in declarations, not selectors.',
    );
  }

  // Check for unmatched brackets/parens
  let parens = 0;
  let brackets = 0;
  for (const ch of selector) {
    if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
    if (parens < 0 || brackets < 0) break;
  }
  if (parens !== 0 || brackets !== 0) {
    console.warn(
      `[typestyles] when.selector() has unmatched brackets or parentheses: "${selector}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// Condition compilation — turns ThemeCondition into CSS wrappers
// ---------------------------------------------------------------------------

type CompiledCondition = {
  media?: string;
  selectorPrefix?: string;
  selectorSuffix?: string;
};

/** Strip paired `not` wrappers; `negated` is true when an odd number of `not`s remain. */
function peelNot(condition: ThemeConditionNot): { negated: boolean; inner: ThemeCondition } {
  let negated = true;
  let c: ThemeCondition = condition.condition;
  while (c.type === 'not') {
    negated = !negated;
    c = c.condition;
  }
  return { negated, inner: c };
}

function compileCondition(condition: ThemeCondition): CompiledCondition[] {
  switch (condition.type) {
    case 'media':
      return [{ media: condition.query }];

    case 'attr':
      if (condition.scope === 'self') {
        return [{ selectorSuffix: `[${condition.name}="${condition.value}"]` }];
      }
      return [{ selectorPrefix: `[${condition.name}="${condition.value}"]` }];

    case 'class':
      if (condition.scope === 'self') {
        return [{ selectorSuffix: `.${condition.name}` }];
      }
      return [{ selectorPrefix: `.${condition.name}` }];

    case 'selector':
      return [{ selectorPrefix: condition.selector }];

    case 'and': {
      let result: CompiledCondition[] = [{}];
      for (const child of condition.conditions) {
        const childCompiled = compileCondition(child);
        const merged: CompiledCondition[] = [];
        for (const existing of result) {
          for (const cc of childCompiled) {
            merged.push(mergeCompiled(existing, cc));
          }
        }
        result = merged;
      }
      return result;
    }

    case 'or':
      return condition.conditions.flatMap((c) => compileCondition(c));

    case 'not': {
      const { negated: shouldNegate, inner } = peelNot(condition);
      if (!shouldNegate) {
        return compileCondition(inner);
      }

      if (inner.type === 'selector') {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[typestyles] when.not(when.selector(...)) is not supported — arbitrary selector text is not safe to wrap in :not(). Use when.attr, when.className, or when.media instead.',
          );
        }
        return [];
      }

      const innerBranches = compileCondition(inner);
      if (innerBranches.length !== 1) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[typestyles] when.not() requires the inner condition to compile to a single rule branch. ' +
              'Do not wrap when.or(), and avoid inner shapes that expand to multiple branches.',
          );
        }
        return [];
      }

      const negated = negateCompiled(innerBranches[0]);
      if (negated === null) {
        return [];
      }
      return [negated];
    }
  }
}

function negateCompiled(c: CompiledCondition): CompiledCondition | null {
  const { media, selectorPrefix, selectorSuffix } = c;
  const hasMedia = Boolean(media);
  const hasPre = Boolean(selectorPrefix);
  const hasSuf = Boolean(selectorSuffix);

  if (hasMedia && (hasPre || hasSuf)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[typestyles] when.not() does not support negating combined @media + selector conditions. ' +
          'Split into separate modes or use only media, only ancestor selector, or only self selector.',
      );
    }
    return null;
  }

  if (hasPre && hasSuf) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[typestyles] when.not() does not support negating combined ancestor + self selector parts on one branch.',
      );
    }
    return null;
  }

  if (hasMedia && media) {
    return { media: `not ${media}` };
  }

  if (hasPre && selectorPrefix) {
    const p = selectorPrefix.trim();
    return { selectorPrefix: `:root:not(${p})` };
  }

  if (hasSuf && selectorSuffix) {
    const s = selectorSuffix.trim();
    if (s.startsWith('[') || s.startsWith('.')) {
      return { selectorSuffix: `:not(${s})` };
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[typestyles] when.not(): unexpected selector suffix shape: "${s}"`);
    }
    return null;
  }

  return {};
}

function mergeCompiled(a: CompiledCondition, b: CompiledCondition): CompiledCondition {
  return {
    media: a.media && b.media ? `${a.media} and ${b.media}` : a.media || b.media || undefined,
    selectorPrefix:
      a.selectorPrefix && b.selectorPrefix
        ? `${a.selectorPrefix} ${b.selectorPrefix}`
        : a.selectorPrefix || b.selectorPrefix || undefined,
    selectorSuffix:
      a.selectorSuffix && b.selectorSuffix
        ? `${a.selectorSuffix}${b.selectorSuffix}`
        : a.selectorSuffix || b.selectorSuffix || undefined,
  };
}

// ---------------------------------------------------------------------------
// CSS declaration building
// ---------------------------------------------------------------------------

function buildDeclarations(scopeId: string | undefined, overrides: ThemeOverrides): string {
  const parts: string[] = [];
  for (const [namespace, values] of Object.entries(overrides)) {
    if (values === null || values === undefined) continue;
    const cssNs = scopedTokenNamespace(scopeId, namespace);
    for (const [key, value] of flattenTokenEntries(values as TokenValues)) {
      parts.push(`--${cssNs}-${key}: ${value}`);
    }
  }
  return parts.join('; ');
}

function themeSegment(scopeId: string | undefined, name: string): string {
  const n = sanitizeClassSegment(name);
  if (!scopeId) return n;
  return `${sanitizeClassSegment(scopeId)}-${n}`;
}

function buildSelector(themeClass: string, compiled: CompiledCondition): string {
  const prefix = compiled.selectorPrefix ? `${compiled.selectorPrefix} ` : '';
  const suffix = compiled.selectorSuffix ?? '';
  return `${prefix}.${themeClass}${suffix}`;
}

function buildRule(selector: string, declarations: string, media?: string): string {
  if (media) {
    return `@media ${media} { ${selector} { ${declarations}; } }`;
  }
  return `${selector} { ${declarations}; }`;
}

// ---------------------------------------------------------------------------
// Color mode presets — tokens.colorMode.*
// ---------------------------------------------------------------------------

type ColorModeMediaOnlyOptions = {
  dark: ThemeOverrides;
};

type ColorModeAttributeOnlyOptions = {
  attribute: string;
  values: { dark: string; light?: string };
  scope: 'self' | 'ancestor';
  dark: ThemeOverrides;
  light?: ThemeOverrides;
};

type ColorModeMediaOrAttributeOptions = {
  attribute: string;
  values: { dark: string; light?: string; system?: string };
  scope: 'self' | 'ancestor';
  dark: ThemeOverrides;
};

type ColorModeSystemWithOverrideOptions = {
  attribute: string;
  values: { light: string; dark: string; system?: string };
  scope: 'self' | 'ancestor';
  light: ThemeOverrides;
  dark: ThemeOverrides;
};

function presetMediaOnly(opts: ColorModeMediaOnlyOptions): ThemeModeDefinition[] {
  return [
    {
      id: 'dark',
      overrides: opts.dark,
      when: when.prefersDark,
    },
  ];
}

function presetAttributeOnly(opts: ColorModeAttributeOnlyOptions): ThemeModeDefinition[] {
  const modes: ThemeModeDefinition[] = [
    {
      id: 'dark',
      overrides: opts.dark,
      when: when.attr(opts.attribute, opts.values.dark, { scope: opts.scope }),
    },
  ];

  if (opts.light && opts.values.light) {
    modes.push({
      id: 'light',
      overrides: opts.light,
      when: when.attr(opts.attribute, opts.values.light, { scope: opts.scope }),
    });
  }

  return modes;
}

/**
 * Dark when the OS prefers dark **or** the attribute matches `values.dark`.
 *
 * **`values.system`** — Optional app-facing token only. No extra CSS rule is emitted for it:
 * with `data-*` set to `system`, neither branch of the `or` matches from the attribute side;
 * appearance follows the media branch (and your `base` tokens) like OS “system” mode.
 */
function presetMediaOrAttribute(opts: ColorModeMediaOrAttributeOptions): ThemeModeDefinition[] {
  return [
    {
      id: 'dark',
      overrides: opts.dark,
      when: when.or(
        when.prefersDark,
        when.attr(opts.attribute, opts.values.dark, { scope: opts.scope }),
      ),
    },
  ];
}

function presetSystemWithLightDarkOverride(
  opts: ColorModeSystemWithOverrideOptions,
): ThemeModeDefinition[] {
  // Four-rule pattern:
  // 1. (base is handled by createTheme, not here)
  // 2. Dark under @media (prefers-color-scheme: dark)
  // 3. Dark under attribute=dark (forced dark)
  // 4. Light under @media dark + attribute=light (forced light overriding system dark)
  return [
    {
      id: 'dark-media',
      overrides: opts.dark,
      when: when.prefersDark,
    },
    {
      id: 'dark-attr',
      overrides: opts.dark,
      when: when.attr(opts.attribute, opts.values.dark, { scope: opts.scope }),
    },
    {
      id: 'light-override',
      overrides: opts.light,
      when: when.and(
        when.prefersDark,
        when.attr(opts.attribute, opts.values.light, { scope: opts.scope }),
      ),
    },
  ];
}

/**
 * Color mode presets that expand into `ThemeModeDefinition[]` arrays.
 * Use via the `colorMode` property on `tokens.createTheme()`.
 *
 * @example
 * ```ts
 * tokens.createTheme('acme', {
 *   base: lightTokens,
 *   colorMode: tokens.colorMode.systemWithLightDarkOverride({
 *     attribute: 'data-color-mode',
 *     values: { light: 'light', dark: 'dark' },
 *     scope: 'ancestor',
 *     light: lightTokens,
 *     dark: darkTokens,
 *   }),
 * });
 * ```
 */
export const colorMode = {
  mediaOnly: presetMediaOnly,
  attributeOnly: presetAttributeOnly,
  mediaOrAttribute: presetMediaOrAttribute,
  systemWithLightDarkOverride: presetSystemWithLightDarkOverride,
} as const;

// ---------------------------------------------------------------------------
// ThemeSurface factory
// ---------------------------------------------------------------------------

function createThemeSurface(name: string, className: string): ThemeSurface {
  return {
    className,
    name,
    toString() {
      return className;
    },
    [Symbol.toPrimitive]() {
      return className;
    },
  };
}

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

/**
 * Create a themed surface with base token overrides and optional mode layers.
 *
 * Returns a `ThemeSurface` object whose `className` (and string coercion)
 * is a stable, human-readable class name like `"theme-acme"`.
 *
 * @example
 * ```ts
 * const acme = tokens.createTheme('acme', {
 *   base: { color: { text: { primary: '#111827' } } },
 *   colorMode: tokens.colorMode.mediaOnly({ dark: darkOverrides }),
 * });
 *
 * // acme.className === 'theme-acme'
 * // `${acme}` === 'theme-acme'
 * ```
 */
export function createTheme(name: string, config: ThemeConfig, scopeId?: string): ThemeSurface {
  if (process.env.NODE_ENV !== 'production') {
    if (config.modes && config.colorMode) {
      throw new Error(
        `[typestyles] createTheme('${name}'): provide either "modes" or "colorMode", not both. ` +
          `Use "modes" for manual conditions or "colorMode" for presets like tokens.colorMode.mediaOnly().`,
      );
    }
  }

  const segment = themeSegment(scopeId, name);
  const className = `theme-${segment}`;

  // 1. Base rule
  const baseDecls = config.base ? buildDeclarations(scopeId, config.base) : '';
  if (baseDecls) {
    insertRule(`theme:${segment}:base`, `.${className} { ${baseDecls}; }`);
  } else {
    // Emit an empty base rule so the class always exists in the sheet
    insertRule(`theme:${segment}:base`, `.${className} { }`);
  }

  // 2. Mode layers
  const modes = config.modes ?? config.colorMode ?? [];
  const rules: Array<{ key: string; css: string }> = [];

  for (const mode of modes) {
    const decls = buildDeclarations(scopeId, mode.overrides);
    if (!decls) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] createTheme('${name}'): mode "${mode.id}" has empty overrides — no CSS was emitted for this mode. Remove the mode or add token overrides.`,
        );
      }
      continue;
    }

    const compiledBranches = compileCondition(mode.when);

    for (let i = 0; i < compiledBranches.length; i++) {
      const branch = compiledBranches[i];
      const selector = buildSelector(className, branch);
      const key = `theme:${segment}:mode:${mode.id}:branch:${i}`;
      rules.push({ key, css: buildRule(selector, decls, branch.media) });
    }
  }

  if (rules.length > 0) {
    insertRules(rules);
  }

  return createThemeSurface(name, className);
}

// ---------------------------------------------------------------------------
// createDarkMode shorthand
// ---------------------------------------------------------------------------

/**
 * Shorthand: create a theme surface that applies `darkOverrides` under
 * `@media (prefers-color-scheme: dark)`.
 *
 * Equivalent to:
 * ```ts
 * tokens.createTheme(name, {
 *   modes: [{ id: 'dark', overrides: darkOverrides, when: tokens.when.prefersDark }],
 * });
 * ```
 */
export function createDarkMode(
  name: string,
  darkOverrides: ThemeOverrides,
  scopeId?: string,
): ThemeSurface {
  return createTheme(
    name,
    {
      modes: [{ id: 'dark', overrides: darkOverrides, when: when.prefersDark }],
    },
    scopeId,
  );
}
