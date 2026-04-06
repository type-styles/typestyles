import type { CSSProperties } from './types';

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
