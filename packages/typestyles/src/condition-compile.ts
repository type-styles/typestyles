import type { ThemeCondition, ThemeConditionNot } from './types';

export type CompiledCondition = {
  media?: string;
  selectorPrefix?: string;
  selectorSuffix?: string;
};

/**
 * Selector context for compiling {@link ThemeCondition} into CSS.
 * Theme modes use `anchor: '.theme-{name}'`; override conditions use the
 * component selector as `anchor` and optional `scopePrefix` (e.g. `.theme-acme`).
 */
export type ConditionCompileContext = {
  /** Selector for the element `scope: 'self'` conditions apply to (includes leading `.`). */
  anchor: string;
  /**
   * When set (override path), inserted as an ancestor prefix inside compiled
   * selectors — e.g. `.theme-acme` from `selectorPrefix`.
   */
  scopePrefix?: string;
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
    if (selectorSuffix.startsWith(' ')) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          "[typestyles] when.not() does not support descendant-scoped conditions — a descendant relationship can't be expressed as a single :not() compound selector. Define an explicit mode for the non-matching state instead.",
        );
      }
      return null;
    }
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

/**
 * Compile a {@link ThemeCondition} into one or more CSS wrapper branches.
 * `when.or` emits one branch per OR child (same as theme modes).
 */
export function compileThemeCondition(condition: ThemeCondition): CompiledCondition[] {
  switch (condition.type) {
    case 'media':
      return [{ media: condition.query }];

    case 'attr':
      if (condition.scope === 'self') {
        return [{ selectorSuffix: `[${condition.name}="${condition.value}"]` }];
      }
      if (condition.scope === 'descendant') {
        return [{ selectorSuffix: ` [${condition.name}="${condition.value}"]` }];
      }
      return [{ selectorPrefix: `[${condition.name}="${condition.value}"]` }];

    case 'class':
      if (condition.scope === 'self') {
        return [{ selectorSuffix: `.${condition.name}` }];
      }
      if (condition.scope === 'descendant') {
        return [{ selectorSuffix: ` .${condition.name}` }];
      }
      return [{ selectorPrefix: `.${condition.name}` }];

    case 'selector':
      return [{ selectorPrefix: condition.selector }];

    case 'and': {
      let result: CompiledCondition[] = [{}];
      for (const child of condition.conditions) {
        const childCompiled = compileThemeCondition(child);
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
      return condition.conditions.flatMap((c) => compileThemeCondition(c));

    case 'not': {
      const { negated: shouldNegate, inner } = peelNot(condition);
      if (!shouldNegate) {
        return compileThemeCondition(inner);
      }

      if (inner.type === 'selector') {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[typestyles] when.not(when.selector(...)) is not supported — arbitrary selector text is not safe to wrap in :not(). Use when.attr, when.className, or when.media instead.',
          );
        }
        return [];
      }

      const innerBranches = compileThemeCondition(inner);
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

/** Build a full selector string from compile context and a compiled branch. */
export function buildSelectorForContext(
  ctx: ConditionCompileContext,
  compiled: CompiledCondition,
): string {
  const scope = ctx.scopePrefix ? `${ctx.scopePrefix} ` : '';
  const ancestor = compiled.selectorPrefix ? `${compiled.selectorPrefix} ` : '';
  const suffix = compiled.selectorSuffix ?? '';
  return `${scope}${ancestor}${ctx.anchor}${suffix}`;
}

/** Wrap serialized rule CSS in `@media` when the branch has a media query. */
export function wrapRuleCss(css: string, media?: string): string {
  if (!media) return css;
  return `@media ${media} { ${css} }`;
}
