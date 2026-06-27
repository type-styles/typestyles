import { declare } from '@babel/helper-plugin-utils';
import type { ConfigAPI, PluginObj, NodePath } from '@babel/core';
import type { Program } from '@babel/types';
import * as t from '@babel/types';

const CSS_PROP_HELPER = '__typestylesCss';
const CSS_PROP_RUNTIME_IMPORT = '@typestyles/react/css-prop-runtime';
const CX_IMPORT = 'typestyles';

export type TypestylesReactPluginOptions = {
  /** Module path for the styles instance (default: `'./styles'`). */
  stylesImport?: string;
  /** Named export for styles (default: `'styles'`). */
  stylesExport?: string;
};

function isStaticCssValue(node: t.Node): node is t.ObjectExpression | t.Identifier {
  return t.isObjectExpression(node) || t.isIdentifier(node);
}

function expressionFromJsxAttributeValue(
  value: t.JSXAttribute['value'] | undefined,
): t.Expression | null {
  if (value == null) {
    return null;
  }
  if (t.isJSXExpressionContainer(value)) {
    if (t.isJSXEmptyExpression(value.expression)) {
      return null;
    }
    return value.expression;
  }
  if (t.isStringLiteral(value)) {
    return value;
  }
  return null;
}

function mergeClassNames(
  cssCall: t.Expression,
  existingClassName: t.JSXAttribute['value'] | undefined,
): t.Expression {
  const existingExpr = expressionFromJsxAttributeValue(existingClassName);
  if (existingExpr == null) {
    return cssCall;
  }

  return t.callExpression(t.identifier('cx'), [cssCall, existingExpr]);
}

export default declare((api: ConfigAPI, options: TypestylesReactPluginOptions = {}) => {
  api.assertVersion(7);

  const stylesImportPath = options.stylesImport ?? './styles';
  const stylesExport = options.stylesExport ?? 'styles';

  let injectedHelper = false;
  let injectedImports = false;

  function ensureImports(program: Program): void {
    if (injectedImports) {
      return;
    }

    program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier('cssProp'), t.identifier('cssProp'))],
        t.stringLiteral(CSS_PROP_RUNTIME_IMPORT),
      ),
      t.importDeclaration(
        [t.importSpecifier(t.identifier('cx'), t.identifier('cx'))],
        t.stringLiteral(CX_IMPORT),
      ),
      t.importDeclaration(
        [t.importSpecifier(t.identifier(stylesExport), t.identifier(stylesExport))],
        t.stringLiteral(stylesImportPath),
      ),
    );

    injectedImports = true;
  }

  function ensureHelper(program: Program): void {
    if (injectedHelper) {
      return;
    }

    program.body.splice(
      injectedImports ? 3 : 0,
      0,
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(CSS_PROP_HELPER),
          t.arrowFunctionExpression(
            [t.identifier('properties')],
            t.callExpression(t.identifier('cssProp'), [
              t.identifier(stylesExport),
              t.identifier('properties'),
            ]),
          ),
        ),
      ]),
    );

    injectedHelper = true;
  }

  return {
    name: '@typestyles/react/babel',
    visitor: {
      Program: {
        exit() {
          injectedHelper = false;
          injectedImports = false;
        },
      },
      JSXAttribute(attributePath: NodePath<t.JSXAttribute>) {
        const { node } = attributePath;
        if (!t.isJSXIdentifier(node.name, { name: 'css' })) {
          return;
        }

        const value = node.value;
        if (value == null || !t.isJSXExpressionContainer(value)) {
          return;
        }

        if (t.isJSXEmptyExpression(value.expression)) {
          return;
        }

        if (!isStaticCssValue(value.expression)) {
          return;
        }

        const programPath = attributePath.findParent((parent) => parent.isProgram());
        if (!programPath?.isProgram()) {
          return;
        }

        ensureImports(programPath.node);
        ensureHelper(programPath.node);

        const jsxElement = attributePath.parentPath;
        if (!jsxElement.isJSXOpeningElement()) {
          return;
        }

        const cssCall = t.callExpression(t.identifier(CSS_PROP_HELPER), [value.expression]);

        let existingClassName: t.JSXAttribute | undefined;
        for (const attr of jsxElement.node.attributes) {
          if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'className' })) {
            existingClassName = attr;
            break;
          }
        }

        const classNameValue = mergeClassNames(cssCall, existingClassName?.value ?? undefined);

        if (existingClassName) {
          existingClassName.value = t.jsxExpressionContainer(classNameValue);
        } else {
          jsxElement.node.attributes.push(
            t.jsxAttribute(t.jsxIdentifier('className'), t.jsxExpressionContainer(classNameValue)),
          );
        }

        attributePath.remove();
      },
    },
  } satisfies PluginObj;
});
