import ts from 'typescript';
import {
  evaluateStaticValue,
  getObjectPropertyExpression,
  getStaticPropertyKey,
} from './ast-utils';
import { parseColor } from './document-index';

export interface TokenValueVariant {
  label: string;
  value: string;
  color?: string;
  detail?: string;
}

export interface TokenPreview {
  /** Token path segments, e.g. ['theme', 'primary']. */
  path: string[];
  /** CSS custom property name, e.g. `--theme-primary`. */
  cssVar: string;
  variants: TokenValueVariant[];
}

export function tokenPathKey(path: readonly string[]): string {
  return path.join('.');
}

export function tokenCssVarName(namespace: string, path: readonly string[]): string {
  const leaf = path.slice(1).join('-') || path[path.length - 1] || namespace;
  return `--${namespace}-${leaf}`;
}

export function resolveTokenPreview(
  tokenNamespaces: Array<{
    namespace: string;
    bindingName?: string;
    leaves: Array<{ path: string[]; value: string; color?: string }>;
  }>,
  themes: ThemeDefinition[],
  path: readonly string[],
  bindingName?: string,
): TokenPreview | null {
  const key = tokenPathKey(path);
  const namespace = path[0];
  if (!namespace) return null;

  const leaf =
    tokenNamespaces.flatMap((ns) => ns.leaves).find((item) => tokenPathKey(item.path) === key) ??
    (bindingName
      ? tokenNamespaces
          .flatMap((ns) => ns.leaves)
          .find(
            (item) =>
              `${bindingName}.${item.path.slice(1).join('.')}` ===
              `${bindingName}.${path.slice(1).join('.')}`,
          )
      : undefined);

  const variants: TokenValueVariant[] = [];

  if (leaf) {
    variants.push({
      label: 'Default',
      value: leaf.value,
      color: leaf.color ?? parseColor(leaf.value) ?? undefined,
      detail: ':root',
    });
  }

  for (const theme of themes) {
    for (const mode of theme.modes) {
      const override = mode.overrides.get(key);
      if (!override) continue;
      variants.push({
        label: mode.label,
        value: override,
        color: parseColor(override) ?? undefined,
        detail: mode.detail,
      });
    }
  }

  if (variants.length === 0) return null;

  return {
    path: [...path],
    cssVar: tokenCssVarName(namespace, path),
    variants,
  };
}

export interface ThemeModeEntry {
  label: string;
  detail: string;
  overrides: Map<string, string>;
}

export interface ThemeDefinition {
  name: string;
  className: string;
  modes: ThemeModeEntry[];
}

export function collectThemeDefinitions(
  sourceFile: ts.SourceFile,
  tokenValues: Map<string, string>,
): ThemeDefinition[] {
  const themes: ThemeDefinition[] = [];
  const bindings = collectObjectLiteralBindings(sourceFile, tokenValues);

  const visit = (node: ts.Node) => {
    if (!ts.isCallExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    const themeName = getCreateThemeName(node);
    if (!themeName || !node.arguments[1] || !ts.isObjectLiteralExpression(node.arguments[1])) {
      ts.forEachChild(node, visit);
      return;
    }

    const config = node.arguments[1];
    const modes: ThemeModeEntry[] = [];

    for (const prop of config.properties) {
      const entry = getObjectPropertyExpression(prop);
      if (!entry) continue;
      const { key, expression } = entry;

      if (key === 'base') {
        const overrides = flattenThemeOverrides(expression, tokenValues, bindings);
        if (overrides.size > 0) {
          modes.push({
            label: 'Theme base',
            detail: `.theme-${sanitizeThemeSegment(themeName)}`,
            overrides,
          });
        }
        continue;
      }

      if (key === 'modes' && ts.isArrayLiteralExpression(expression)) {
        modes.push(...parseThemeModeArray(expression, tokenValues, bindings));
        continue;
      }

      if (key === 'colorMode') {
        modes.push(...parseColorModeExpression(expression, tokenValues, bindings));
      }
    }

    themes.push({
      name: themeName,
      className: `theme-${sanitizeThemeSegment(themeName)}`,
      modes,
    });

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return themes;
}

function sanitizeThemeSegment(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'theme'
  );
}

function getCreateThemeName(node: ts.CallExpression): string | null {
  const { expression, arguments: args } = node;
  const first = args[0];
  if (!first || !ts.isStringLiteral(first)) return null;

  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.name) &&
    expression.name.text === 'createTheme' &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text.endsWith('tokens')
  ) {
    return first.text;
  }

  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name)) {
    if (expression.name.text === 'createTheme') return first.text;
  }

  if (ts.isIdentifier(expression) && expression.text === 'createTheme') {
    return first.text;
  }

  return null;
}

function collectObjectLiteralBindings(
  sourceFile: ts.SourceFile,
  tokenValues: Map<string, string>,
): Map<string, ts.ObjectLiteralExpression> {
  const bindings = new Map<string, ts.ObjectLiteralExpression>();

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      bindings.set(node.name.text, node.initializer);
      const evaluated = evaluateStaticValue(node.initializer, tokenValues);
      if (evaluated && typeof evaluated === 'object' && !Array.isArray(evaluated)) {
        flattenThemeOverridesFromRecord(evaluated as Record<string, unknown>, '', tokenValues);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return bindings;
}

function flattenThemeOverridesFromRecord(
  record: Record<string, unknown>,
  namespace: string,
  sink: Map<string, string>,
): void {
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue;
    if (typeof value === 'string') {
      const path = namespace ? `${namespace}.${key}` : key;
      sink.set(path, value);
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nextNamespace = namespace ? `${namespace}.${key}` : key;
      flattenThemeOverridesFromRecord(value as Record<string, unknown>, nextNamespace, sink);
    }
  }
}

function flattenThemeOverrides(
  node: ts.Expression,
  tokenValues: Map<string, string>,
  bindings: Map<string, ts.ObjectLiteralExpression>,
): Map<string, string> {
  const resolved = resolveThemeObject(node, tokenValues, bindings);
  const overrides = new Map<string, string>();
  if (resolved) flattenThemeOverridesFromRecord(resolved, '', overrides);
  return overrides;
}

function resolveThemeObject(
  node: ts.Expression,
  tokenValues: Map<string, string>,
  bindings: Map<string, ts.ObjectLiteralExpression>,
): Record<string, unknown> | null {
  if (ts.isIdentifier(node)) {
    const binding = bindings.get(node.text);
    if (binding) {
      const value = evaluateStaticValue(binding, tokenValues);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }
    return null;
  }

  const value = evaluateStaticValue(node, tokenValues);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseThemeModeArray(
  node: ts.ArrayLiteralExpression,
  tokenValues: Map<string, string>,
  bindings: Map<string, ts.ObjectLiteralExpression>,
): ThemeModeEntry[] {
  const modes: ThemeModeEntry[] = [];

  for (const element of node.elements) {
    if (!element || !ts.isObjectLiteralExpression(element)) continue;

    let id = 'mode';
    let overridesNode: ts.Expression | undefined;
    let whenNode: ts.Expression | undefined;

    for (const prop of element.properties) {
      const key = getStaticPropertyKey(prop);
      if (!key || !ts.isPropertyAssignment(prop)) continue;
      if (key === 'id' && ts.isStringLiteral(prop.initializer)) id = prop.initializer.text;
      if (key === 'overrides') overridesNode = prop.initializer;
      if (key === 'when') whenNode = prop.initializer;
    }

    if (!overridesNode) continue;
    const overrides = flattenThemeOverrides(overridesNode, tokenValues, bindings);
    if (overrides.size === 0) continue;

    modes.push({
      label: capitalize(id),
      detail: describeThemeCondition(whenNode),
      overrides,
    });
  }

  return modes;
}

function parseColorModeExpression(
  node: ts.Expression,
  tokenValues: Map<string, string>,
  bindings: Map<string, ts.ObjectLiteralExpression>,
): ThemeModeEntry[] {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return [];

  const preset = node.expression.name.text;
  const arg = node.arguments[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return [];

  let lightNode: ts.Expression | undefined;
  let darkNode: ts.Expression | undefined;
  let attribute = 'data-mode';
  let values: { light?: string; dark?: string } = {};

  for (const prop of arg.properties) {
    const entry = getObjectPropertyExpression(prop);
    if (!entry) continue;
    const { key, expression } = entry;
    if (key === 'light') lightNode = expression;
    if (key === 'dark') darkNode = expression;
    if (key === 'attribute' && ts.isStringLiteral(expression)) attribute = expression.text;
    if (key === 'values' && ts.isObjectLiteralExpression(expression)) {
      for (const valueProp of expression.properties) {
        const valueEntry = getObjectPropertyExpression(valueProp);
        if (!valueEntry) continue;
        if (ts.isStringLiteral(valueEntry.expression)) {
          values = { ...values, [valueEntry.key]: valueEntry.expression.text };
        }
      }
    }
  }

  const modes: ThemeModeEntry[] = [];

  if (preset === 'mediaOnly' && darkNode) {
    const overrides = flattenThemeOverrides(darkNode, tokenValues, bindings);
    if (overrides.size > 0) {
      modes.push({
        label: 'Dark',
        detail: '@media (prefers-color-scheme: dark)',
        overrides,
      });
    }
    return modes;
  }

  if (preset === 'attributeOnly' && darkNode) {
    const overrides = flattenThemeOverrides(darkNode, tokenValues, bindings);
    if (overrides.size > 0) {
      modes.push({
        label: 'Dark',
        detail: `${attribute}="${values.dark ?? 'dark'}"`,
        overrides,
      });
    }
    return modes;
  }

  if (preset === 'mediaOrAttribute' && darkNode) {
    const overrides = flattenThemeOverrides(darkNode, tokenValues, bindings);
    if (overrides.size > 0) {
      modes.push({
        label: 'Dark',
        detail: `prefers dark or ${attribute}="${values.dark ?? 'dark'}"`,
        overrides,
      });
    }
    return modes;
  }

  if (preset === 'systemWithLightDarkOverride') {
    if (darkNode) {
      const darkOverrides = flattenThemeOverrides(darkNode, tokenValues, bindings);
      if (darkOverrides.size > 0) {
        modes.push({
          label: 'Dark',
          detail: 'prefers dark or forced dark',
          overrides: darkOverrides,
        });
      }
    }
    if (lightNode) {
      const lightOverrides = flattenThemeOverrides(lightNode, tokenValues, bindings);
      if (lightOverrides.size > 0) {
        modes.push({
          label: 'Light',
          detail: 'forced light on dark OS',
          overrides: lightOverrides,
        });
      }
    }
  }

  return modes;
}

function describeThemeCondition(node: ts.Expression | undefined): string {
  if (!node) return 'conditional';
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
    const root = node.expression.text;
    const member = node.name.text;
    if (root === 'tokens' || root.endsWith('tokens')) {
      if (member === 'prefersDark') return '@media (prefers-color-scheme: dark)';
      if (member === 'prefersLight') return '@media (prefers-color-scheme: light)';
    }
  }
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const method = node.expression.name.text;
    const arg = node.arguments[0];
    if (method === 'media' && arg && ts.isStringLiteral(arg)) return `@media ${arg.text}`;
    if (method === 'attr' && arg && ts.isStringLiteral(arg)) {
      const valueArg = node.arguments[1];
      const value = valueArg && ts.isStringLiteral(valueArg) ? valueArg.text : '…';
      return `${arg.text}="${value}"`;
    }
  }
  return 'conditional';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
