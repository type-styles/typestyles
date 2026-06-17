import { describe, expect, it } from 'vitest';
import {
  parsePropInterpolation,
  parseTemplateInterpolations,
  reconstructInterpolatedCss,
} from '../src/interpolations';
import { parse } from '@babel/parser';
import * as t from '@babel/types';

function parseExpression(code: string): t.Expression {
  const ast = parse(`(${code})`, { sourceType: 'module' });
  const statement = ast.program.body[0];
  if (!t.isExpressionStatement(statement)) {
    throw new Error('Expected expression statement');
  }
  return statement.expression;
}

function parseTemplate(code: string): t.TemplateLiteral {
  const ast = parse(`const x = ${code}`, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  const declaration = ast.program.body[0];
  if (!t.isVariableDeclaration(declaration)) {
    throw new Error('Expected variable declaration');
  }
  const init = declaration.declarations[0]?.init;
  if (!init || !t.isTemplateLiteral(init)) {
    throw new Error('Expected template literal');
  }
  return init;
}

describe('parsePropInterpolation', () => {
  it('parses props => props.color', () => {
    expect(parsePropInterpolation(parseExpression('(props) => props.color'))).toEqual({
      propName: 'color',
    });
  });

  it('rejects theme access', () => {
    expect(parsePropInterpolation(parseExpression('(props) => props.theme.color'))).toBeNull();
  });

  it('rejects conditional expressions', () => {
    expect(
      parsePropInterpolation(parseExpression("(props) => (props.primary ? 'red' : 'blue')")),
    ).toBeNull();
  });
});

describe('parseTemplateInterpolations', () => {
  it('extracts suffix text after interpolation', () => {
    const template = parseTemplate('`width: ${(props) => props.width}px;`');
    expect(parseTemplateInterpolations(template)).toEqual([
      { index: 0, propName: 'width', suffix: 'px' },
    ]);
  });

  it('reconstructs css with placeholders', () => {
    const template = parseTemplate('`color: ${(props) => props.color}; background: red;`');
    const interpolations = parseTemplateInterpolations(template);
    expect(interpolations).not.toBeNull();
    expect(reconstructInterpolatedCss(template, interpolations!)).toBe(
      'color: __ts_migrate_var_0__; background: red;',
    );
  });
});
