import type { ClassNamingConfig } from './class-naming';
import type { CascadeLayersObjectInput } from './layers';
import { createGlobal } from './create-global';
import type { GlobalApiLayered, GlobalApiUnlayered } from './create-global';
import { createStyles } from './styles';
import type {
  StylesApi,
  StylesApiWithLayers,
  StylesWithUtilsApi,
  StylesWithUtilsApiLayered,
} from './styles';
import type { StyleUtils } from './types';
import type { BreakpointsConfig } from './breakpoints';
import { createTokens } from './tokens';
import type { TokensApi } from './tokens';

type NamingPartial = Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
  breakpoints?: BreakpointsConfig;
};

type GlobalLayerOption<L extends string = string> = {
  /**
   * Default `@layer` for `global.style()` when using `layers`.
   * Omit to require `{ layer }` on each `global.style` call or recipe tuple.
   * Per-call override: `global.style(selector, props, { layer: '…' })` or `body(props, { layer: '…' })`.
   */
  globalLayer?: L;
};

/** Unified factory: one `scopeId`, shared cascade layer stack for both class rules and token/theme CSS. */
export function createTypeStyles<U extends StyleUtils>(
  options: NamingPartial & { utils: U },
): { styles: StylesWithUtilsApi<U>; tokens: TokensApi; global: GlobalApiUnlayered };

export function createTypeStyles<
  const L extends readonly [string, ...string[]],
  U extends StyleUtils,
>(
  options: NamingPartial & { layers: L; tokenLayer: L[number]; utils: U } & GlobalLayerOption<
      L[number]
    >,
): {
  styles: StylesWithUtilsApiLayered<U, L[number]>;
  tokens: TokensApi;
  global: GlobalApiLayered;
};

export function createTypeStyles<U extends StyleUtils>(
  options: NamingPartial & {
    layers: CascadeLayersObjectInput;
    tokenLayer: string;
    utils: U;
  } & GlobalLayerOption,
): { styles: StylesWithUtilsApiLayered<U, string>; tokens: TokensApi; global: GlobalApiLayered };

export function createTypeStyles(options: NamingPartial): {
  styles: StylesApi;
  tokens: TokensApi;
  global: GlobalApiUnlayered;
};

export function createTypeStyles<const L extends readonly [string, ...string[]]>(
  options: NamingPartial & { layers: L; tokenLayer: L[number] } & GlobalLayerOption<L[number]>,
): { styles: StylesApiWithLayers<L[number]>; tokens: TokensApi; global: GlobalApiLayered };

export function createTypeStyles(
  options: NamingPartial & {
    layers: CascadeLayersObjectInput;
    tokenLayer: string;
  } & GlobalLayerOption,
): { styles: StylesApiWithLayers<string>; tokens: TokensApi; global: GlobalApiLayered };

export function createTypeStyles(
  options: NamingPartial & {
    layers?: CascadeLayersObjectInput | readonly string[];
    tokenLayer?: string;
    globalLayer?: string;
    utils?: StyleUtils;
  },
): {
  styles:
    | StylesApi
    | StylesApiWithLayers<string>
    | StylesWithUtilsApi<StyleUtils>
    | StylesWithUtilsApiLayered<StyleUtils, string>;
  tokens: TokensApi;
  global: GlobalApiUnlayered | GlobalApiLayered;
} {
  const { layers, tokenLayer, globalLayer, utils, ...rest } = options;

  if (layers != null) {
    if (tokenLayer === undefined) {
      throw new Error(
        '[typestyles] `createTypeStyles({ layers })` requires `tokenLayer` — the default `@layer` for `:root` and theme CSS.',
      );
    }
    const styles =
      utils !== undefined
        ? createStyles({ ...rest, layers, tokenLayer, utils })
        : createStyles({ ...rest, layers, tokenLayer });
    const tokens = createTokens({ scopeId: rest.scopeId, layers, tokenLayer });
    const global = createGlobal({
      layers,
      scopeId: rest.scopeId,
      globalLayer,
      breakpoints: rest.breakpoints,
    });
    return { styles, tokens, global };
  }

  if (tokenLayer !== undefined) {
    throw new Error(
      '[typestyles] `createTypeStyles`: `tokenLayer` is only valid together with `layers`.',
    );
  }

  if (globalLayer !== undefined) {
    throw new Error(
      '[typestyles] `createTypeStyles`: `globalLayer` is only valid together with `layers`.',
    );
  }

  const styles = utils !== undefined ? createStyles({ ...rest, utils }) : createStyles(rest);
  const tokens = createTokens({ scopeId: rest.scopeId });
  const global = createGlobal({ scopeId: rest.scopeId, breakpoints: rest.breakpoints });
  return { styles, tokens, global };
}
