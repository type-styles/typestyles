/**
 * CSS serialization aligned with `packages/typestyles/src/css.ts`.
 * Kept local so the extension does not bundle the full runtime.
 */

export type StyleRecord = Record<string, unknown>;

export function toKebabCase(prop: string): string {
  if (prop.startsWith('ms')) {
    return '-' + prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  }
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

const UNITLESS_PROPERTIES = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'fontSizeAdjust',
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
  'initialLetter',
  'lineClamp',
  'lineHeight',
  'maskBorderOutset',
  'maskBorderSlice',
  'maskBorderWidth',
  'opacity',
  'order',
  'orphans',
  'scale',
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

const VENDOR_PREFIX_RE = /^(Webkit|Moz|ms|O)([A-Z])(.*)$/;

function isUnitlessProperty(prop: string): boolean {
  if (UNITLESS_PROPERTIES.has(prop)) return true;
  const match = VENDOR_PREFIX_RE.exec(prop);
  if (match) {
    return UNITLESS_PROPERTIES.has(match[2].toLowerCase() + match[3]);
  }
  return false;
}

export function serializeCSSValue(prop: string, value: string | number): string {
  if (typeof value === 'number') {
    if (value === 0) return '0';
    if (isUnitlessProperty(prop)) return String(value);
    return value + 'px';
  }
  return value;
}

export function formatDeclaration(prop: string, value: string | number): string {
  return `${toKebabCase(prop)}: ${serializeCSSValue(prop, value)}`;
}

export interface CSSRule {
  key: string;
  css: string;
}

export function serializeStyle(selector: string, properties: StyleRecord): CSSRule[] {
  const rules: CSSRule[] = [];
  const declarations: string[] = [];

  for (const [prop, value] of Object.entries(properties)) {
    if (value == null) continue;

    const nestedSelector = resolveNestedSelector(selector, prop);
    if (nestedSelector) {
      rules.push(...serializeStyle(nestedSelector, value as StyleRecord));
    } else if (prop.startsWith('@')) {
      const innerRules = serializeStyle(selector, value as StyleRecord);
      for (const inner of innerRules) {
        rules.push({
          key: `${prop}:${inner.key}`,
          css: `${prop} { ${inner.css} }`,
        });
      }
    } else if (typeof value === 'string' || typeof value === 'number') {
      declarations.push(formatDeclaration(prop, value));
    }
  }

  if (declarations.length > 0) {
    rules.unshift({
      key: selector,
      css: `${selector} { ${declarations.join('; ')}; }`,
    });
  }

  return rules;
}

export function resolveNestedSelector(parentSelector: string, key: string): string | null {
  if (key.includes('&')) {
    return key.replace(/&/g, parentSelector);
  }
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
      if (char === quote && prev !== '\\') quote = null;
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

  if (current.trim()) result.push(current.trim());
  return result;
}
