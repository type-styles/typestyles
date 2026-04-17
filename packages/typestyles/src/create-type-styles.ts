import type { ClassNamingConfig } from './class-naming';
import type { CascadeLayersObjectInput } from './layers';
import { createGlobal } from './create-global';
import type { GlobalApiLayered, GlobalApiUnlayered } from './create-global';
import { createStyles } from './styles';
import type { StylesApi, StylesApiWithLayers } from './styles';
import { createTokens } from './tokens';
import type { TokensApi } from './tokens';

type NamingPartial = Partial<Omit<ClassNamingConfig, 'cascadeLayers'>>;

type GlobalLayerOption<L extends string = string> = {
  /**
   * Default `@layer` for `global.style()` when using `layers`.
   * Omit to require `{ layer }` on each `global.style` call or recipe tuple.
   * Per-call override: `global.style(selector, props, { layer: '…' })` or `body(props, { layer: '…' })`.
   */
  globalLayer?: L;
};

/** Unified factory: one `scopeId`, shared cascade layer stack for both class rules and token/theme CSS. */
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
  },
): {
  styles: StylesApi | StylesApiWithLayers<string>;
  tokens: TokensApi;
  global: GlobalApiUnlayered | GlobalApiLayered;
} {
  const { layers, tokenLayer, globalLayer, ...rest } = options;

  if (layers != null) {
    if (tokenLayer === undefined) {
      throw new Error(
        '[typestyles] `createTypeStyles({ layers })` requires `tokenLayer` — the default `@layer` for `:root` and theme CSS.',
      );
    }
    const styles = createStyles({ ...rest, layers, tokenLayer });
    const tokens = createTokens({ scopeId: rest.scopeId, layers, tokenLayer });
    const global = createGlobal({
      layers,
      scopeId: rest.scopeId,
      globalLayer,
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

  const styles = createStyles(rest);
  const tokens = createTokens({ scopeId: rest.scopeId });
  const global = createGlobal({ scopeId: rest.scopeId });
  return { styles, tokens, global };
}
