import type { TSESTree } from '@typescript-eslint/utils';

const NESTED_SELECTOR_KEY_RE = /^(&|@|\[)/;

/** Keys that wrap nested style objects in component configs. */
const COMPONENT_STRUCTURAL_KEYS = new Set([
  'base',
  'variants',
  'defaultVariants',
  'compoundVariants',
  'slots',
]);

export function getStaticPropertyKey(prop: TSESTree.Property): string | null {
  if (prop.computed) return null;
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value;
  return null;
}

export function isCssPropertyKey(key: string): boolean {
  if (NESTED_SELECTOR_KEY_RE.test(key)) return false;
  if (COMPONENT_STRUCTURAL_KEYS.has(key)) return false;
  return /^[a-zA-Z]/.test(key);
}

/**
 * Collect CSS property names declared at the top level of a style object literal.
 */
export function collectCssPropertyNames(obj: TSESTree.ObjectExpression): string[] {
  const names: string[] = [];
  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const key = getStaticPropertyKey(prop);
    if (key && isCssPropertyKey(key)) names.push(key);
  }
  return names;
}

/**
 * Visit each style object literal in a TypeStyles style/config tree.
 * Recurses into pseudos, at-rules, component `base` / `variants`, and slot objects.
 */
export function visitStyleObjectLiterals(
  node: TSESTree.ObjectExpression,
  onStyleObject: (obj: TSESTree.ObjectExpression) => void,
): void {
  onStyleObject(node);

  for (const prop of node.properties) {
    if (prop.type !== 'Property') continue;
    const key = getStaticPropertyKey(prop);
    if (!key) continue;

    if (NESTED_SELECTOR_KEY_RE.test(key)) {
      if (prop.value.type === 'ObjectExpression') {
        visitStyleObjectLiterals(prop.value, onStyleObject);
      }
      continue;
    }

    if (key === 'variants' && prop.value.type === 'ObjectExpression') {
      for (const groupProp of prop.value.properties) {
        if (groupProp.type !== 'Property' || groupProp.value.type !== 'ObjectExpression') continue;
        for (const optionProp of groupProp.value.properties) {
          if (optionProp.type === 'Property' && optionProp.value.type === 'ObjectExpression') {
            visitStyleObjectLiterals(optionProp.value, onStyleObject);
          }
        }
      }
      continue;
    }

    if (key === 'compoundVariants' && prop.value.type === 'ArrayExpression') {
      for (const element of prop.value.elements) {
        if (!element || element.type !== 'ObjectExpression') continue;
        for (const cvProp of element.properties) {
          if (cvProp.type !== 'Property') continue;
          const cvKey = getStaticPropertyKey(cvProp);
          if (cvKey === 'css' && cvProp.value.type === 'ObjectExpression') {
            visitStyleObjectLiterals(cvProp.value, onStyleObject);
          }
        }
      }
      continue;
    }

    if (
      (COMPONENT_STRUCTURAL_KEYS.has(key) || prop.value.type === 'ObjectExpression') &&
      prop.value.type === 'ObjectExpression'
    ) {
      visitStyleObjectLiterals(prop.value, onStyleObject);
    }
  }
}

export function getStringLiteralValue(node: TSESTree.Node): string | null {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  return null;
}

export function getNumericLiteralValue(node: TSESTree.Node): number | null {
  if (node.type === 'Literal' && typeof node.value === 'number') return node.value;
  return null;
}
