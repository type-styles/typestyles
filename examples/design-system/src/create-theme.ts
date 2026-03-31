import { insertRules, tokens } from 'typestyles';
import { flattenColorValues } from './tokens/semantic';
import type {
  DeepPartial,
  DesignPrimitiveOverrides,
  DesignSemanticValues,
  DesignTheme,
  DesignThemeConfig,
} from './types';

type FlatThemeOverrides = Record<string, Record<string, string>>;

function flattenSemanticValues(semantic: DeepPartial<DesignSemanticValues>): FlatThemeOverrides {
  const out: FlatThemeOverrides = {};
  if (semantic.color) out.color = flattenColorValues(semantic.color as Record<string, Record<string, string>>);
  if (semantic.syntax) out.syntax = { ...semantic.syntax };
  return out;
}

function flattenPrimitiveOverrides(primitives: DesignPrimitiveOverrides): FlatThemeOverrides {
  return Object.fromEntries(
    Object.entries(primitives).filter(([, values]) => values && Object.keys(values).length > 0)
  ) as FlatThemeOverrides;
}

function buildVarDeclString(overrides: FlatThemeOverrides): string {
  return Object.entries(overrides)
    .flatMap(([namespace, values]) =>
      Object.entries(values).map(([key, value]) => `--${namespace}-${key}: ${value};`)
    )
    .join(' ');
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
