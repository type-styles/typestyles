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

export function registerAtPropertyRule(
  name: string,
  options: { value: string; syntax: string; inherits?: boolean },
): void {
  // Skip `@property` for dependent values (token/`env()` refs). Emitting
  // `syntax: "*"` (the only form allowed without initial-value) makes Chromium
  // fail to invalidate properties that reference the registered custom property
  // when its var()-resolved value changes — e.g. light/dark theme toggles leave
  // `color: var(--component-color)` stuck on the previous computed color.
  // Defaults still reach the cascade via `registerRootCustomProperty` / base styles.
  // Note: skipping registration means CSS's default `inherits: true` for custom
  // properties applies; pass a literal `value` when you need typed `@property`.
  if (!isComputationallyIndependent(options.value)) {
    return;
  }

  const inherits = options.inherits ?? false;
  const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${options.value}; }`;
  insertRule(`@property:${name}`, css);
}

export function registerRootCustomProperty(name: string, value: string): void {
  insertRule(`property-root:${name}`, `:root { ${name}: ${value}; }`);
}

export function registerRegisteredProperty(
  name: string,
  options: { value?: string; syntax?: string; inherits?: boolean },
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
