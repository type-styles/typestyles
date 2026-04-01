import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { cssToObjectExpression } from './css.js';
import type { FileMigrationResult, MigrationWarning } from './types.js';

type StyledTarget =
  | { kind: 'intrinsic'; jsxName: t.JSXIdentifier }
  | { kind: 'component'; jsxName: t.JSXIdentifier | t.JSXMemberExpression };

type StyledTransform = {
  originalName: string;
  classConstName: string;
  target: StyledTarget;
};

function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function memberExpressionToJsxName(
  expression: t.Expression,
): t.JSXIdentifier | t.JSXMemberExpression | null {
  if (t.isIdentifier(expression)) {
    return t.jsxIdentifier(expression.name);
  }

  if (t.isMemberExpression(expression) && !expression.computed) {
    const left = memberExpressionToJsxName(expression.object as t.Expression);
    const right = t.isIdentifier(expression.property)
      ? t.jsxIdentifier(expression.property.name)
      : null;
    if (!left || !right) return null;
    return t.jsxMemberExpression(left, right);
  }

  return null;
}

function parseStyledTarget(
  tag: t.TaggedTemplateExpression['tag'],
  styledNames: Set<string>,
): StyledTarget | null {
  if (
    t.isMemberExpression(tag) &&
    t.isIdentifier(tag.object) &&
    styledNames.has(tag.object.name) &&
    t.isIdentifier(tag.property)
  ) {
    return { kind: 'intrinsic', jsxName: t.jsxIdentifier(tag.property.name) };
  }

  if (t.isCallExpression(tag) && t.isIdentifier(tag.callee) && styledNames.has(tag.callee.name)) {
    const firstArg = tag.arguments[0];
    if (!firstArg || !t.isExpression(firstArg)) return null;
    const jsxName = memberExpressionToJsxName(firstArg);
    if (!jsxName) return null;
    return { kind: 'component', jsxName };
  }

  return null;
}

function addWarning(warnings: MigrationWarning[], message: string, nodeName?: string): void {
  warnings.push({ message, nodeName });
}

function createMergedClassExpression(
  existing: t.Expression,
  classNameIdentifier: t.Identifier,
): t.Expression {
  return t.callExpression(
    t.memberExpression(
      t.callExpression(
        t.memberExpression(
          t.arrayExpression([existing, classNameIdentifier]),
          t.identifier('filter'),
        ),
        [t.identifier('Boolean')],
      ),
      t.identifier('join'),
    ),
    [t.stringLiteral(' ')],
  );
}

function updateClassNameAttribute(
  openingElement: t.JSXOpeningElement,
  classNameIdentifier: t.Identifier,
): void {
  const existingAttr = openingElement.attributes.find(
    (attribute): attribute is t.JSXAttribute =>
      t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: 'className' }),
  );

  if (!existingAttr) {
    openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier('className'), t.jsxExpressionContainer(classNameIdentifier)),
    );
    return;
  }

  if (!existingAttr.value) {
    existingAttr.value = t.jsxExpressionContainer(classNameIdentifier);
    return;
  }

  if (t.isStringLiteral(existingAttr.value)) {
    existingAttr.value = t.jsxExpressionContainer(
      createMergedClassExpression(t.stringLiteral(existingAttr.value.value), classNameIdentifier),
    );
    return;
  }

  if (t.isJSXExpressionContainer(existingAttr.value)) {
    existingAttr.value = t.jsxExpressionContainer(
      createMergedClassExpression(
        existingAttr.value.expression as t.Expression,
        classNameIdentifier,
      ),
    );
  }
}

function ensureStylesImport(ast: t.File): void {
  let typestylesImport: t.ImportDeclaration | null = null;

  for (const statement of ast.program.body) {
    if (t.isImportDeclaration(statement) && statement.source.value === 'typestyles') {
      typestylesImport = statement;
      break;
    }
  }

  if (!typestylesImport) {
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier('styles'), t.identifier('styles'))],
        t.stringLiteral('typestyles'),
      ),
    );
    return;
  }

  const hasStylesSpecifier = typestylesImport.specifiers.some(
    (specifier) =>
      t.isImportSpecifier(specifier) &&
      t.isIdentifier(specifier.imported, { name: 'styles' }) &&
      t.isIdentifier(specifier.local, { name: 'styles' }),
  );

  if (!hasStylesSpecifier) {
    typestylesImport.specifiers.push(
      t.importSpecifier(t.identifier('styles'), t.identifier('styles')),
    );
  }
}

function cleanupUnusedImports(ast: t.File): void {
  traverse(ast, {
    Program(path) {
      path.scope.crawl();
    },
    ImportDeclaration(path) {
      const unusedLocals = path.node.specifiers.filter((specifier) => {
        if (
          path.node.source.value === 'typestyles' &&
          t.isImportSpecifier(specifier) &&
          t.isIdentifier(specifier.local, { name: 'styles' })
        ) {
          return false;
        }
        const local = specifier.local.name;
        const binding = path.scope.getBinding(local);
        return !binding || binding.referencePaths.length === 0;
      });

      if (unusedLocals.length === 0) return;

      path.node.specifiers = path.node.specifiers.filter(
        (specifier) => !unusedLocals.includes(specifier),
      );
      if (path.node.specifiers.length === 0) {
        path.remove();
      }
    },
  });
}

function isOnlyJsxReferences(
  binding: NodePath<t.VariableDeclarator>['scope']['bindings'][string],
): boolean {
  return binding.referencePaths.every((referencePath) => {
    const parent = referencePath.parentPath;
    if (!parent) return false;
    return (
      (parent.isJSXOpeningElement() && parent.get('name') === referencePath) ||
      (parent.isJSXClosingElement() && parent.get('name') === referencePath)
    );
  });
}

export function migrateSource(filePath: string, source: string): FileMigrationResult {
  const warnings: MigrationWarning[] = [];
  let changed = false;

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const styledNames = new Set<string>();
  const cssTagNames = new Set<string>();
  const styledTransforms = new Map<string, StyledTransform>();

  traverse(ast, {
    ImportDeclaration(path) {
      if (
        path.node.source.value === 'styled-components' ||
        path.node.source.value === '@emotion/styled'
      ) {
        for (const specifier of path.node.specifiers) {
          if (t.isImportDefaultSpecifier(specifier)) {
            styledNames.add(specifier.local.name);
          }
          if (
            t.isImportSpecifier(specifier) &&
            t.isIdentifier(specifier.imported, { name: 'css' })
          ) {
            cssTagNames.add(specifier.local.name);
          }
        }
      }

      if (
        path.node.source.value === '@emotion/react' ||
        path.node.source.value === '@emotion/css'
      ) {
        for (const specifier of path.node.specifiers) {
          if (
            t.isImportSpecifier(specifier) &&
            t.isIdentifier(specifier.imported, { name: 'css' })
          ) {
            cssTagNames.add(specifier.local.name);
          }
        }
      }
    },
  });

  traverse(ast, {
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id)) return;
      if (!t.isTaggedTemplateExpression(path.node.init)) return;

      const variableName = path.node.id.name;
      const binding = path.scope.getBinding(variableName);
      if (!binding) return;

      const template = path.node.init.quasi;
      if (template.expressions.length > 0) {
        addWarning(
          warnings,
          'Skipped template literal with interpolations. Only static templates are migrated.',
          variableName,
        );
        return;
      }

      const cssText = template.quasis.map((quasi) => quasi.value.cooked ?? '').join('');
      const objectExpression = cssToObjectExpression(cssText, warnings);
      if (!objectExpression) {
        addWarning(warnings, 'Skipped because CSS could not be parsed.', variableName);
        return;
      }

      const styledTarget = parseStyledTarget(path.node.init.tag, styledNames);
      if (styledTarget) {
        const declaration = path.parentPath;
        if (
          declaration.parentPath?.isExportNamedDeclaration() ||
          declaration.parentPath?.isExportDefaultDeclaration()
        ) {
          addWarning(
            warnings,
            'Skipped exported styled component to avoid changing external API shape.',
            variableName,
          );
          return;
        }

        if (!isOnlyJsxReferences(binding)) {
          addWarning(warnings, 'Skipped styled component with non-JSX references.', variableName);
          return;
        }

        const classConstName = path.scope.generateUidIdentifier(`${variableName}Class`).name;
        path.node.id = t.identifier(classConstName);
        path.node.init = t.callExpression(
          t.memberExpression(t.identifier('styles'), t.identifier('class')),
          [t.stringLiteral(toKebabCase(variableName)), objectExpression],
        );

        styledTransforms.set(variableName, {
          originalName: variableName,
          classConstName,
          target: styledTarget,
        });
        changed = true;
        return;
      }

      if (t.isIdentifier(path.node.init.tag) && cssTagNames.has(path.node.init.tag.name)) {
        path.node.init = t.callExpression(
          t.memberExpression(t.identifier('styles'), t.identifier('class')),
          [t.stringLiteral(toKebabCase(variableName)), objectExpression],
        );
        changed = true;
      }
    },
  });

  if (styledTransforms.size > 0) {
    traverse(ast, {
      JSXElement(path) {
        const openingName = path.node.openingElement.name;
        if (!t.isJSXIdentifier(openingName)) return;
        const transform = styledTransforms.get(openingName.name);
        if (!transform) return;

        path.node.openingElement.name = transform.target.jsxName;
        if (path.node.closingElement) {
          path.node.closingElement.name = transform.target.jsxName;
        }

        updateClassNameAttribute(path.node.openingElement, t.identifier(transform.classConstName));
      },
    });
  }

  if (changed) {
    ensureStylesImport(ast);
    cleanupUnusedImports(ast);
  }

  const output = generate(
    ast,
    {
      retainLines: false,
      comments: true,
      concise: false,
    },
    source,
  );

  return {
    filePath,
    changed: changed && output.code !== source,
    code: output.code,
    warnings,
  };
}
