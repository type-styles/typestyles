import postcss, { type ChildNode, type Container } from 'postcss';
import * as t from '@babel/types';
import type { MigrationWarning } from './types.js';

function camelCaseProperty(property: string): string {
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toValueNode(value: string): t.Expression {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return t.numericLiteral(Number(trimmed));
  }
  return t.stringLiteral(trimmed);
}

function toKeyNode(key: string): t.Expression {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return t.identifier(key);
  }
  return t.stringLiteral(key);
}

function nodesToObject(
  nodes: ChildNode[] | undefined,
  warnings: MigrationWarning[],
): t.ObjectExpression {
  const properties: t.ObjectProperty[] = [];

  for (const node of nodes ?? []) {
    if (node.type === 'decl') {
      const normalized = node.prop.startsWith('--') ? node.prop : camelCaseProperty(node.prop);
      properties.push(t.objectProperty(toKeyNode(normalized), toValueNode(node.value)));
      continue;
    }

    if (node.type === 'rule') {
      const nested = nodesToObject(node.nodes, warnings);
      properties.push(t.objectProperty(t.stringLiteral(node.selector.trim()), nested));
      continue;
    }

    warnings.push({
      message: `Unsupported CSS node "${node.type}" skipped.`,
    });
  }

  return t.objectExpression(properties);
}

export function cssToObjectExpression(
  cssText: string,
  warnings: MigrationWarning[],
): t.ObjectExpression | null {
  try {
    const root = postcss.parse(cssText);
    return nodesToObject((root as unknown as Container).nodes, warnings);
  } catch (error) {
    warnings.push({
      message: `Could not parse CSS template literal: ${(error as Error).message}`,
    });
    return null;
  }
}
