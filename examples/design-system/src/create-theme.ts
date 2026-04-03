import { flattenTokenEntries, insertRules, tokens, type TokenValues } from 'typestyles';
import type {
  DeepPartial,
  DesignPrimitiveOverrides,
  DesignSemanticValues,
  DesignTheme,
  DesignThemeConfig,
} from './types';

type ThemeOverrideMap = Record<string, TokenValues | undefined>;

function flattenSemanticValues(semantic: DeepPartial<DesignSemanticValues>): ThemeOverrideMap {
  const out: ThemeOverrideMap = {};
  if (semantic.color != null) out.color = semantic.color as TokenValues;
  if (semantic.syntax != null) out.syntax = semantic.syntax as TokenValues;
  return out;
}

function flattenPrimitiveOverrides(primitives: DesignPrimitiveOverrides): ThemeOverrideMap {
  return Object.fromEntries(
    Object.entries(primitives).filter(([, values]) => values && Object.keys(values).length > 0),
  ) as ThemeOverrideMap;
}

function buildVarDeclString(overrides: ThemeOverrideMap): string {
  const parts: string[] = [];
  for (const [namespace, values] of Object.entries(overrides)) {
    if (values === undefined || values === null) continue;
    if (typeof values !== 'object') continue;
    for (const [key, value] of flattenTokenEntries(values)) {
      parts.push(`--${namespace}-${key}: ${value};`);
    }
  }
  return parts.join(' ');
}

export function createDesignTheme(config: DesignThemeConfig): DesignTheme {
  const lightTheme = {
    ...flattenSemanticValues(config.light),
    ...flattenPrimitiveOverrides(config.primitives ?? {}),
    ...(config.components?.codeBlock ? { codeBlock: config.components.codeBlock } : {}),
  };

  const className = tokens.createTheme(config.name, lightTheme);
  const lightDecls = buildVarDeclString(flattenSemanticValues(config.light));
  const darkDecls = buildVarDeclString(flattenSemanticValues(config.dark));

  if (darkDecls.length > 0) {
    insertRules([
      {
        key: `theme:${config.name}:dark-media`,
        css: `@media (prefers-color-scheme: dark) { .${className} { ${darkDecls} } }`,
      },
      {
        key: `theme:${config.name}:dark-attr`,
        css: `.${className}[data-mode="dark"] { ${darkDecls} }`,
      },
    ]);
  }

  insertRules([
    {
      key: `theme:${config.name}:light-attr`,
      css: `@media (prefers-color-scheme: dark) { .${className}[data-mode="light"] { ${lightDecls} } }`,
    },
  ]);

  return {
    className,
    name: config.name,
    lightValues: config.light,
    darkValues: config.dark,
    primitiveOverrides: config.primitives,
  };
}
