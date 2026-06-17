import * as t from '@babel/types';
import type { BooleanTernaryInterpolation } from './interpolations';

function toCssValueNode(value: string): t.Expression {
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
    return t.numericLiteral(Number(value));
  }
  return t.stringLiteral(value);
}

function toKeyNode(key: string): t.Expression {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return t.identifier(key);
  }
  return t.stringLiteral(key);
}

function buildVariantStyles(properties: Record<string, string>): t.ObjectExpression {
  return t.objectExpression(
    Object.entries(properties).map(([key, value]) =>
      t.objectProperty(toKeyNode(key), toCssValueNode(value)),
    ),
  );
}

export function buildVariantComponentConfig(
  baseObject: t.ObjectExpression,
  booleanInterpolations: BooleanTernaryInterpolation[],
): t.ObjectExpression {
  const variantGroups = new Map<
    string,
    { true: Record<string, string>; false: Record<string, string> }
  >();

  for (const interpolation of booleanInterpolations) {
    const group = variantGroups.get(interpolation.propName) ?? { true: {}, false: {} };
    group.true[interpolation.cssProperty] = interpolation.trueValue;
    group.false[interpolation.cssProperty] = interpolation.falseValue;
    variantGroups.set(interpolation.propName, group);
  }

  const variantsProperties = [...variantGroups.entries()].map(([propName, values]) =>
    t.objectProperty(
      t.identifier(propName),
      t.objectExpression([
        t.objectProperty(t.identifier('true'), buildVariantStyles(values.true)),
        t.objectProperty(t.identifier('false'), buildVariantStyles(values.false)),
      ]),
    ),
  );

  const defaultVariantProperties = [...variantGroups.keys()].map((propName) =>
    t.objectProperty(t.identifier(propName), t.booleanLiteral(false)),
  );

  return t.objectExpression([
    t.objectProperty(t.identifier('base'), baseObject),
    t.objectProperty(t.identifier('variants'), t.objectExpression(variantsProperties)),
    t.objectProperty(t.identifier('defaultVariants'), t.objectExpression(defaultVariantProperties)),
  ]);
}
