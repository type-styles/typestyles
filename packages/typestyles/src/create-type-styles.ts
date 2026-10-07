import type { ClassNamingConfig } from './class-naming';
import { createGlobal } from './create-global';
import type { GlobalApiLayered, GlobalApiUnlayered } from './create-global';
import { createStyles, createClass, createHashClass } from './styles';
import type { ComponentRegistryApi, StylesApi } from './styles';
import type { CSSProperties, StyleUtils } from './types';
import type { BreakpointsConfig } from './breakpoints';
import type { ColorModeMap } from './color-modes';
import { createTokens } from './tokens';
import type { TokensApi } from './tokens';
import type { CascadeLayersObjectInput } from './layers';
import type { OverrideFn } from './override';
import type { ScopeOptions } from './scope';
import type { StylesPropertyFn } from './types';
import type { ContainerNameRef } from './container';
import type { BreakpointMediaFn, MediaFn } from './media';

type NamingPartial = Partial<Omit<ClassNamingConfig, 'cascadeLayers' | 'styleLayer'>> & {
  breakpoints?: BreakpointsConfig;
  colorModes?: ColorModeMap;
};

/**
 * Nested cascade-layer config for {@link createTypeStyles}.
 * `token` and `style` defaults are required so call sites rarely repeat `{ layer }`.
 */
export type TypeStylesLayersConfig<L extends string = string> = {
  readonly order: readonly [L, ...L[]];
  /** Default `@layer` for `:root` / theme token CSS. */
  readonly token: L;
  /** Default `@layer` for `style` / `recipe` / `style.hash`. */
  readonly style: L;
  /** Default `@layer` for `global.rule` / `global.rules` / `global.apply`. */
  readonly global?: L;
  readonly prependFrameworkLayers?: readonly string[];
};

export type StyleFn = ((
  name: string,
  properties: CSSProperties,
  options?: { layer?: string },
) => string) & {
  hash(properties: CSSProperties, options?: { label?: string; layer?: string }): string;
};

/** Flat public surface returned by {@link createTypeStyles}. */
export type TypeStylesApi = ComponentRegistryApi & {
  readonly classNaming: Readonly<ClassNamingConfig>;
  /** Create a single named class (was `styles.class`). */
  style: StyleFn;
  /**
   * Multi-variant / slot recipe (was `styles.component`).
   * Extra optional `{ layer?, themeable? }` is allowed when overriding the factory `layers.style` default.
   */
  recipe: StylesApi['component'] &
    ((
      namespace: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: any,
      options?: { layer?: string; themeable?: boolean },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => any);
  tokens: TokensApi;
  global: GlobalApiUnlayered | GlobalApiLayered;
  compose: StylesApi['compose'];
  override: OverrideFn;
  scope: (opts: ScopeOptions, className: string, overrides: CSSProperties) => void;
  property: StylesPropertyFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any;
  containerRef: (label: string) => ContainerNameRef;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  atRuleBlock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  when: any;
  breakpoint: BreakpointMediaFn;
  media: MediaFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any;
};

type CreateTypeStylesOptionsBase = NamingPartial & {
  utils?: StyleUtils;
  mode?: ClassNamingConfig['mode'];
};

function cascadeInputFromLayers(
  layers:
    | TypeStylesLayersConfig
    | (CascadeLayersObjectInput & { token: string; style: string; global?: string }),
): CascadeLayersObjectInput {
  return {
    order: layers.order,
    prependFrameworkLayers: layers.prependFrameworkLayers,
  };
}

function buildStyleFn(classNaming: ClassNamingConfig): StyleFn {
  const style = ((name: string, properties: CSSProperties, options?: { layer?: string }): string =>
    createClass(classNaming, name, properties, options?.layer)) as StyleFn;
  style.hash = (properties, options) =>
    createHashClass(classNaming, properties, options?.label, options?.layer);
  return style;
}

function flattenTypeStylesApi(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any,
  tokens: TokensApi,
  global: GlobalApiUnlayered | GlobalApiLayered,
): TypeStylesApi {
  const s = styles as ComponentRegistryApi & {
    classNaming: ClassNamingConfig;
    component: StylesApi['component'];
    compose: StylesApi['compose'];
    override: OverrideFn;
    scope: TypeStylesApi['scope'];
    property: StylesPropertyFn;
    container: TypeStylesApi['container'];
    containerRef: TypeStylesApi['containerRef'];
    supports: TypeStylesApi['supports'];
    atRuleBlock: TypeStylesApi['atRuleBlock'];
    when: TypeStylesApi['when'];
    breakpoint: BreakpointMediaFn;
    media: MediaFn;
    has: TypeStylesApi['has'];
    is: TypeStylesApi['is'];
    where: TypeStylesApi['where'];
  };
  return {
    classNaming: s.classNaming,
    style: buildStyleFn(s.classNaming),
    recipe: s.component as StylesApi['component'],
    tokens,
    global,
    compose: s.compose,
    override: s.override,
    scope: s.scope,
    property: s.property,
    container: s.container,
    containerRef: s.containerRef,
    supports: s.supports,
    atRuleBlock: s.atRuleBlock,
    when: s.when,
    breakpoint: s.breakpoint,
    media: s.media,
    has: s.has,
    is: s.is,
    where: s.where,
    getComponent: s.getComponent.bind(s),
    getThemeableComponents: s.getThemeableComponents.bind(s),
    listComponentNamespaces: s.listComponentNamespaces.bind(s),
  };
}

/** Unified factory: one `scopeId`, shared cascade layer stack, flat public surface. */
export function createTypeStyles(
  options: CreateTypeStylesOptionsBase & { layers: TypeStylesLayersConfig },
): TypeStylesApi;

export function createTypeStyles(options?: CreateTypeStylesOptionsBase): TypeStylesApi;

export function createTypeStyles(
  options: CreateTypeStylesOptionsBase & { layers?: TypeStylesLayersConfig } = {},
): TypeStylesApi {
  const { layers, utils, ...rest } = options;

  if (layers != null) {
    if (layers.token == null || layers.token === '') {
      throw new Error(
        '[typestyles] `createTypeStyles({ layers })` requires `layers.token` — the default `@layer` for `:root` and theme CSS.',
      );
    }
    if (layers.style == null || layers.style === '') {
      throw new Error(
        '[typestyles] `createTypeStyles({ layers })` requires `layers.style` — the default `@layer` for `style` / `recipe`.',
      );
    }
    const cascade = cascadeInputFromLayers(layers);
    const styles =
      utils !== undefined
        ? createStyles({
            ...rest,
            layers: cascade,
            tokenLayer: layers.token,
            styleLayer: layers.style,
            utils,
          })
        : createStyles({
            ...rest,
            layers: cascade,
            tokenLayer: layers.token,
            styleLayer: layers.style,
          });
    const tokens = createTokens({
      scopeId: rest.scopeId,
      layers: cascade,
      tokenLayer: layers.token,
      colorModes: rest.colorModes,
      themeStyles: styles,
    });
    const global = createGlobal({
      layers: cascade,
      scopeId: rest.scopeId,
      globalLayer: layers.global,
      breakpoints: rest.breakpoints,
    });
    return flattenTypeStylesApi(styles, tokens, global);
  }

  const styles = utils !== undefined ? createStyles({ ...rest, utils }) : createStyles(rest);
  const tokens = createTokens({
    scopeId: rest.scopeId,
    colorModes: rest.colorModes,
    themeStyles: styles,
  });
  const global = createGlobal({ scopeId: rest.scopeId, breakpoints: rest.breakpoints });
  return flattenTypeStylesApi(styles, tokens, global);
}
