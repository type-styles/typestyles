import type { CSSProperties } from './types.js';

/**
 * Convert a camelCase CSS property name to kebab-case.
 * Handles vendor prefixes (ms, webkit, moz) correctly.
 */
export function toKebabCase(prop: string): string {
  // Handle ms- prefix specially (no leading dash in camelCase)
  if (prop.startsWith('ms')) {
    return '-' + prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  }
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * Serialize a single CSS value. Numbers are treated as px for most properties.
 */
function serializeValue(prop: string, value: string | number): string {
  if (typeof value === 'number') {
    if (value === 0) return '0';
    // Unitless properties that shouldn't get 'px'
    if (unitlessProperties.has(prop)) return String(value);
    return value + 'px';
  }
  return value;
}

const unitlessProperties = new Set([
  'animationIterationCount',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
]);

/**
 * Represents a generated CSS rule.
 */
export interface CSSRule {
  /** Unique key for deduplication */
  key: string;
  /** The CSS rule string */
  css: string;
}

/**
 * Serialize a style definition object into CSS rule(s) for a given selector.
 */
export function serializeStyle(selector: string, properties: CSSProperties): CSSRule[] {
  const rules: CSSRule[] = [];
  const declarations: string[] = [];

  for (const [prop, value] of Object.entries(properties)) {
    if (value == null) continue;

    const nestedSelector = resolveNestedSelector(selector, prop);
    if (nestedSelector) {
      rules.push(...serializeStyle(nestedSelector, value as CSSProperties));
    } else if (prop.startsWith('@')) {
      // At-rule: wrap the serialized content in the at-rule
      const innerRules = serializeStyle(selector, value as CSSProperties);
      for (const inner of innerRules) {
        rules.push({
          key: `${prop}:${inner.key}`,
          css: `${prop} { ${inner.css} }`,
        });
      }
    } else {
      // Regular CSS property
      const kebabProp = toKebabCase(prop);
      declarations.push(`${kebabProp}: ${serializeValue(prop, value as string | number)}`);
    }
  }

  // Add the base rule with all plain declarations
  if (declarations.length > 0) {
    rules.unshift({
      key: selector,
      css: `${selector} { ${declarations.join('; ')}; }`,
    });
  }

  return rules;
}

/**
 * Result of serializing a style object in atomic mode.
 * Each declaration becomes its own class; the same property+value in any
 * component reuses the same atomic class, so CSS size plateaus as the
 * codebase grows.
 */
export interface AtomicStyleResult {
  /**
   * Ordered list of atomic class names to apply (one per declaration).
   * Compose them into a `className` prop with `classes.join(' ')`.
   */
  classes: string[];
  /** The CSS rules to register — one per atomic class. */
  rules: CSSRule[];
}

/**
 * Serialize a style definition object into atomic CSS — one class per
 * CSS declaration — using a stable hash of `property:value` as the
 * class name.
 *
 * Nested selectors and at-rules are supported: for each nested rule,
 * each inner declaration still becomes its own atomic class, with the
 * nesting context folded into the class-name hash.
 *
 * @param properties - The style object to decompose.
 * @param prefix     - Class name prefix. Defaults to `"ts"`.
 * @param context    - Internal: the nesting context string (selector or at-rule).
 *
 * @example
 * ```ts
 * const { classes, rules } = serializeAtomicStyle({
 *   color: 'red',
 *   fontSize: '14px',
 *   '&:hover': { color: 'blue' },
 * });
 *
 * // classes → ['ts-abc1', 'ts-def2', 'ts-ghi3']
 * // rules   → [
 * //   { key: 'ts-abc1', css: '.ts-abc1 { color: red; }' },
 * //   { key: 'ts-def2', css: '.ts-def2 { font-size: 14px; }' },
 * //   { key: 'ts-ghi3', css: '.ts-ghi3:hover { color: blue; }' },
 * // ]
 * ```
 */
export function serializeAtomicStyle(
  properties: CSSProperties,
  prefix = 'ts',
  context = '',
): AtomicStyleResult {
  const classes: string[] = [];
  const rules: CSSRule[] = [];

  for (const [prop, value] of Object.entries(properties)) {
    if (value == null) continue;

    const nestedSelector = context ? resolveNestedSelector(context, prop) : null;
    const resolvedNested =
      !context && prop.startsWith('&')
        ? null // handled below via selector placeholder
        : nestedSelector;

    if (prop.startsWith('&') || prop.startsWith('[')) {
      // Nested selector: recurse using a placeholder selector and carry context
      const selectorPlaceholder = prop.startsWith('[') ? `__SELECTOR__${prop}` : prop;
      const inner = serializeAtomicStyle(value as CSSProperties, prefix, selectorPlaceholder);
      // For each inner class, rewrite its selector to reflect the nesting
      for (let i = 0; i < inner.rules.length; i++) {
        const innerRule = inner.rules[i];
        const innerClass = inner.classes[i];
        if (innerRule && innerClass) {
          classes.push(innerClass);
          rules.push(innerRule);
        }
      }
    } else if (prop.startsWith('@')) {
      // At-rule: recurse and wrap each atomic rule in the at-rule
      const inner = serializeAtomicStyle(value as CSSProperties, prefix, context);
      for (let i = 0; i < inner.rules.length; i++) {
        const innerRule = inner.rules[i];
        const innerClass = inner.classes[i];
        if (innerRule && innerClass) {
          const wrappedKey = `${prop}:${innerRule.key}`;
          const wrappedCss = `${prop} { ${innerRule.css} }`;
          classes.push(innerClass);
          rules.push({ key: wrappedKey, css: wrappedCss });
        }
      }
    } else {
      // Plain declaration → one atomic class
      const kebabProp = toKebabCase(prop);
      const serializedValue = serializeValue(prop, value as string | number);

      // Build atomic class name from a hash of context + property + value
      const hashInput = `${context}|${kebabProp}|${serializedValue}`;
      const hash = atomicHash(hashInput);
      const className = `${prefix}-${hash}`;

      // Determine the CSS selector: plain class, or with nesting applied
      let selector: string;
      if (context.startsWith('&')) {
        selector = `.${className}${context.slice(1)}`; // &:hover → .ts-abc:hover
      } else if (context.startsWith('[') || context.startsWith('__SELECTOR__')) {
        const attr = context.startsWith('__SELECTOR__') ? context.slice('__SELECTOR__'.length) : context;
        selector = `.${className}${attr}`;
      } else {
        selector = `.${className}`;
      }

      classes.push(className);
      rules.push({
        key: className,
        css: `${selector} { ${kebabProp}: ${serializedValue}; }`,
      });
    }
  }

  // Deduplicate rules (same key = same class)
  const seen = new Set<string>();
  const uniqueRules: CSSRule[] = [];
  const uniqueClasses: string[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const cls = classes[i];
    if (rule && cls && !seen.has(rule.key)) {
      seen.add(rule.key);
      uniqueRules.push(rule);
      uniqueClasses.push(cls);
    }
  }

  return { classes: uniqueClasses, rules: uniqueRules };
}

/**
 * FNV-1a 32-bit hash, base-36 encoded, truncated to 6 characters.
 * Fast, collision-resistant enough for atomic class names in typical apps.
 */
function atomicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}

function resolveNestedSelector(parentSelector: string, key: string): string | null {
  if (key.startsWith('&')) {
    return key.replace(/&/g, parentSelector);
  }

  // Support attribute selectors without requiring "&", including selector lists:
  // '[data-state="open"], [aria-expanded="true"]'
  if (key.startsWith('[')) {
    const parts = splitSelectorList(key);
    return parts.map((part) => `${parentSelector}${part.trimStart()}`).join(', ');
  }

  return null;
}

function splitSelectorList(selector: string): string[] {
  const result: string[] = [];
  let current = '';
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    const prev = i > 0 ? selector[i - 1] : '';

    if (quote) {
      current += char;
      if (char === quote && prev !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[') bracketDepth++;
    if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (char === ',' && bracketDepth === 0 && parenDepth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}
