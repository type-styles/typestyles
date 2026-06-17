import * as t from '@babel/types';

export type PropInterpolation = {
  index: number;
  propName: string;
  suffix: string;
};

const PLACEHOLDER_PREFIX = '__ts_migrate_var_';

export function placeholderToken(index: number): string {
  return `${PLACEHOLDER_PREFIX}${index}__`;
}

function extractSuffixFromQuasi(quasiText: string): string {
  const match = quasiText.match(/^([^;\n]*)/);
  return match?.[1] ?? '';
}

/**
 * Parse a styled-components prop interpolation such as
 * `(props) => props.color` or `props => props.width`.
 */
export function parsePropInterpolation(expression: t.Expression): { propName: string } | null {
  if (!t.isArrowFunctionExpression(expression)) return null;

  const param = expression.params[0];
  if (!t.isIdentifier(param)) return null;

  const paramName = param.name;
  if (!t.isExpression(expression.body)) return null;

  const body = expression.body;
  if (
    t.isMemberExpression(body) &&
    !body.computed &&
    t.isIdentifier(body.object, { name: paramName }) &&
    t.isIdentifier(body.property)
  ) {
    return { propName: body.property.name };
  }

  return null;
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

export function toVarDebugName(componentName: string, propName: string): string {
  return `${componentName}${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}
