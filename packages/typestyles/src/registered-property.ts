import type { CSSVarRef, RegisteredPropertyOptions, RegisteredPropertyRef } from './types';
import { sanitizeClassSegment, scopedTokenNamespace, type ClassNamingConfig } from './class-naming';
import { insertRule } from './sheet';

export function escapePropertySyntaxString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function createRegisteredPropertyRef(name: string): RegisteredPropertyRef {
  const varRef = `var(${name})` as CSSVarRef;
  return {
    name,
    var: varRef,
    toString() {
      return varRef;
    },
    valueOf() {
      return varRef;
    },
  };
}

/**
 * `@property` initial values must be *computationally independent*
 * (CSS Properties & Values Level 1, §2.4) — `var()` / `env()` references are not.
 */
function isComputationallyIndependent(value: string): boolean {
  return !/\b(?:var|env)\(/i.test(value);
}

/**
 * Safe placeholder `initial-value`s for common single-component syntaxes. A
 * placeholder only needs to satisfy the syntax grammar — the real, possibly
 * `var()`-dependent value always reaches the cascade separately via the
 * unconditional `:root { name: value }` declaration `registerRootCustomProperty`
 * / `tokens.create` emit, which the cascade prefers over `initial-value`.
 */
const SYNTAX_PLACEHOLDERS: Record<string, string> = {
  '<color>': 'transparent',
  '<number>': '0',
  '<integer>': '0',
  '<length>': '0px',
  '<percentage>': '0%',
  '<length-percentage>': '0px',
  '<angle>': '0deg',
  '<time>': '0s',
  '<resolution>': '0dpi',
};

/**
 * Looks up a safe placeholder for `syntax`. Strips one optional trailing `+`/`#`
 * list multiplier first — a single item always satisfies "one or more", so list
 * syntaxes reuse their base placeholder. Anything not an exact match (unions,
 * multi-component syntaxes, `<custom-ident>`, `<url>`, …) returns `undefined`;
 * callers must not guess beyond this table.
 */
function placeholderForSyntax(syntax: string): string | undefined {
  const base = syntax.trim().replace(/[+#]$/, '');
  return SYNTAX_PLACEHOLDERS[base];
}

export function registerAtPropertyRule(
  name: string,
  options: { value: string; syntax: string; inherits?: boolean; initial?: string | number },
): void {
  const inherits = options.inherits ?? false;

  if (isComputationallyIndependent(options.value)) {
    const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${options.value}; }`;
    insertRule(`@property:${name}`, css);
    return;
  }

  // The real (dependent) value reaches the cascade via a separate `:root`
  // declaration — `@property`'s `initial-value` only needs to be *some* valid,
  // computationally independent placeholder for the registered syntax.
  let placeholder: string | undefined;

  if (options.initial !== undefined) {
    const initialStr = String(options.initial);
    // Explicit initial must also be computationally independent
    if (!isComputationallyIndependent(initialStr)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Skipping @property for "${name}": explicit \`initial\` value "${initialStr}" ` +
            `depends on var()/env() and cannot be used as an initial-value (must be computationally ` +
            `independent). Omit \`initial\` to use the built-in placeholder table for this syntax, ` +
            `or provide a literal computationally independent value.`,
        );
      }
      return;
    }
    placeholder = initialStr;
  } else {
    placeholder = placeholderForSyntax(options.syntax);
  }

  if (placeholder === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[typestyles] Skipping @property for "${name}": its value depends on var()/env() and ` +
          `syntax "${options.syntax}" has no built-in placeholder initial-value. Pass an explicit ` +
          `\`initial\` (e.g. { initial: '0' }) to register it typed, or accept the untyped custom property.`,
      );
    }
    return;
  }

  const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${placeholder}; }`;
  insertRule(`@property:${name}`, css);
}

export function registerRootCustomProperty(name: string, value: string): void {
  insertRule(`property-root:${name}`, `:root { ${name}: ${value}; }`);
}

export function registerRegisteredProperty(
  name: string,
  options: { value?: string; syntax?: string; inherits?: boolean; initial?: string | number },
): void {
  if (options.syntax != null) {
    if (options.value == null) {
      throw new Error(
        '[typestyles] Registered properties with `syntax` require `value` for `@property` initial-value.',
      );
    }
    registerAtPropertyRule(name, {
      value: options.value,
      syntax: options.syntax,
      inherits: options.inherits,
      initial: options.initial,
    });
  }

  if (options.value != null) {
    registerRootCustomProperty(name, options.value);
  }
}

export function createStylesPropertyFn(classNaming: ClassNamingConfig) {
  const seen = new Set<string>();
  const ns = scopedTokenNamespace(classNaming.scopeId?.trim() || undefined, 'property');

  return (id: string, options?: RegisteredPropertyOptions): RegisteredPropertyRef => {
    const safeId = sanitizeClassSegment(id);
    if (seen.has(safeId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Duplicate styles.property("${id}") on this styles instance. ` +
            `Declare each id once and reuse the returned ref.`,
        );
      }
    } else {
      seen.add(safeId);
    }

    const name = `--${ns}-${safeId}`;
    if (options) {
      registerRegisteredProperty(name, {
        value: options.value != null ? String(options.value) : undefined,
        syntax: options.syntax,
        inherits: options.inherits,
      });
    }

    return createRegisteredPropertyRef(name);
  };
}
