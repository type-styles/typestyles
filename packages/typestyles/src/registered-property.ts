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
 * (CSS Properties & Values Level 1, §2.4) — `var()` / `env()` references are
 * not, and browsers reject the whole rule at parse/insert time.
 */
function isComputationallyIndependent(value: string): boolean {
  return !/\b(?:var|env)\(/i.test(value);
}

export function registerAtPropertyRule(
  name: string,
  options: { value: string; syntax: string; inherits?: boolean },
): void {
  const inherits = options.inherits ?? false;
  // For dependent values (token refs), degrade to the universal syntax, which
  // is the only form allowed to omit `initial-value`. Type checking is lost,
  // but `inherits` — the load-bearing behavior — survives, and the default
  // still reaches the cascade via `registerRootCustomProperty` / base styles.
  const css = isComputationallyIndependent(options.value)
    ? `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${options.value}; }`
    : `@property ${name} { syntax: "*"; inherits: ${inherits}; }`;
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
