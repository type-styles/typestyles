import * as t from '@babel/types';

export type PropInterpolation = {
  index: number;
  propName: string;
  suffix: string;
};

export type BooleanTernaryInterpolation = {
  index: number;
  propName: string;
  trueValue: string;
  falseValue: string;
  cssProperty: string;
};

const PLACEHOLDER_PREFIX = '__ts_migrate_var_';

function camelCaseProperty(property: string): string {
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function placeholderToken(index: number): string {
  return `${PLACEHOLDER_PREFIX}${index}__`;
}

function extractSuffixFromQuasi(quasiText: string): string {
  const match = quasiText.match(/^([^;\n]*)/);
  return match?.[1] ?? '';
}

function literalToCssValue(node: t.Node): string | null {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNumericLiteral(node)) return String(node.value);
  return null;
}

function unwrapExpression(expression: t.Expression): t.Expression {
  if (t.isParenthesizedExpression(expression)) {
    return unwrapExpression(expression.expression);
  }
  return expression;
}

function extractCssPropertyBeforeInterpolation(quasiText: string): string | null {
  const match = quasiText.match(/([a-zA-Z-]+)\s*:\s*$/);
  return match?.[1] ?? null;
}

function stripTrailingPropertyDeclaration(quasiText: string): string {
  return quasiText.replace(/[a-zA-Z-]+\s*:\s*$/, '');
}

function stripLeadingDeclarationRemainder(quasiText: string): string {
  const semiIdx = quasiText.indexOf(';');
  if (semiIdx === -1) return quasiText;
  return quasiText.slice(semiIdx + 1).trimStart();
}

/**
 * Parse a styled-components prop interpolation such as
 * `(props) => props.color`, `props => props.width`, or `({ color }) => color`.
 */
export function parsePropInterpolation(expression: t.Expression): { propName: string } | null {
  if (!t.isArrowFunctionExpression(expression)) return null;

  const param = expression.params[0];
  if (!param) return null;

  const body = unwrapExpression(expression.body as t.Expression);
  if (!t.isExpression(body)) return null;

  if (t.isIdentifier(param)) {
    if (
      t.isMemberExpression(body) &&
      !body.computed &&
      t.isIdentifier(body.object, { name: param.name }) &&
      t.isIdentifier(body.property)
    ) {
      return { propName: body.property.name };
    }
    return null;
  }

  if (t.isObjectPattern(param) && t.isIdentifier(body)) {
    const propName = body.name;
    const hasProp = param.properties.some((property) => {
      if (!t.isObjectProperty(property)) return false;
      const keyName = t.isIdentifier(property.key)
        ? property.key.name
        : t.isStringLiteral(property.key)
          ? property.key.value
          : null;
      return keyName === propName;
    });
    if (!hasProp) return null;
    return { propName };
  }

  return null;
}

/**
 * Parse `${(props) => (props.primary ? '#0066ff' : '#6b7280')}` style interpolations.
 */
export function parseBooleanTernaryInterpolation(
  expression: t.Expression,
): { propName: string; trueValue: string; falseValue: string } | null {
  if (!t.isArrowFunctionExpression(expression)) return null;

  const param = expression.params[0];
  if (!t.isIdentifier(param)) return null;

  const body = unwrapExpression(expression.body as t.Expression);
  if (!t.isConditionalExpression(body)) return null;

  if (
    !t.isMemberExpression(body.test) ||
    body.test.computed ||
    !t.isIdentifier(body.test.object, { name: param.name }) ||
    !t.isIdentifier(body.test.property)
  ) {
    return null;
  }

  const trueValue = literalToCssValue(body.consequent);
  const falseValue = literalToCssValue(body.alternate);
  if (trueValue === null || falseValue === null) return null;

  return {
    propName: body.test.property.name,
    trueValue,
    falseValue,
  };
}

export function parseTemplateInterpolations(
  template: t.TemplateLiteral,
): PropInterpolation[] | null {
  const interpolations: PropInterpolation[] = [];

  for (let i = 0; i < template.expressions.length; i++) {
    const expression = template.expressions[i];
    if (!t.isExpression(expression)) return null;

    const parsed = parsePropInterpolation(expression);
    if (!parsed) return null;

    const followingQuasi = template.quasis[i + 1]?.value.cooked ?? '';
    interpolations.push({
      index: i,
      propName: parsed.propName,
      suffix: extractSuffixFromQuasi(followingQuasi),
    });
  }

  return interpolations;
}

export function parseBooleanTemplateInterpolations(
  template: t.TemplateLiteral,
): BooleanTernaryInterpolation[] | null {
  const interpolations: BooleanTernaryInterpolation[] = [];

  for (let i = 0; i < template.expressions.length; i++) {
    const expression = template.expressions[i];
    if (!t.isExpression(expression)) return null;

    const parsed = parseBooleanTernaryInterpolation(expression);
    if (!parsed) return null;

    const quasiBefore = template.quasis[i]?.value.cooked ?? '';
    const cssProperty = extractCssPropertyBeforeInterpolation(quasiBefore);
    if (!cssProperty) return null;

    interpolations.push({
      index: i,
      propName: parsed.propName,
      trueValue: parsed.trueValue,
      falseValue: parsed.falseValue,
      cssProperty: camelCaseProperty(cssProperty),
    });
  }

  return interpolations;
}

export function reconstructInterpolatedCss(
  template: t.TemplateLiteral,
  interpolations: PropInterpolation[],
): string {
  let result = '';

  for (let i = 0; i < template.quasis.length; i++) {
    let quasiText = template.quasis[i].value.cooked ?? '';

    if (i > 0) {
      const interpolation = interpolations[i - 1];
      if (interpolation?.suffix && quasiText.startsWith(interpolation.suffix)) {
        quasiText = quasiText.slice(interpolation.suffix.length);
      }
    }

    result += quasiText;

    if (i < interpolations.length) {
      result += placeholderToken(interpolations[i].index);
    }
  }

  return result;
}

export function reconstructStaticCssWithoutVariants(
  template: t.TemplateLiteral,
  booleanInterpolations: BooleanTernaryInterpolation[],
): string {
  const skipIndices = new Set(booleanInterpolations.map((interpolation) => interpolation.index));
  let result = '';

  for (let i = 0; i < template.quasis.length; i++) {
    let quasiText = template.quasis[i].value.cooked ?? '';

    if (skipIndices.has(i)) {
      quasiText = stripTrailingPropertyDeclaration(quasiText);
    }

    if (i > 0 && skipIndices.has(i - 1)) {
      quasiText = stripLeadingDeclarationRemainder(quasiText);
    }

    result += quasiText;
  }

  return result.trim();
}

export function toVarDebugName(componentName: string, propName: string): string {
  return `${componentName}${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

export function toComponentConstName(componentName: string): string {
  if (!componentName) return componentName;
  return componentName.charAt(0).toLowerCase() + componentName.slice(1);
}
