import type { ClassNamingConfig } from './class-naming.js';
import type { CascadeLayersObjectInput } from './layers.js';
import { createStyles } from './styles.js';
import type { StylesApi, StylesApiWithLayers } from './styles.js';
import { createTokens } from './tokens.js';
import type { TokensApi } from './tokens.js';

type NamingPartial = Partial<Omit<ClassNamingConfig, 'cascadeLayers'>>;

/** Unified factory: one `scopeId`, shared cascade layer stack for both class rules and token/theme CSS. */
export function createTypeStyles(options: NamingPartial): { styles: StylesApi; tokens: TokensApi };

export function createTypeStyles<const L extends readonly [string, ...string[]]>(
  options: NamingPartial & { layers: L; tokenLayer: L[number] },
): { styles: StylesApiWithLayers<L[number]>; tokens: TokensApi };

export function createTypeStyles(
  options: NamingPartial & { layers: CascadeLayersObjectInput; tokenLayer: string },
): { styles: StylesApiWithLayers<string>; tokens: TokensApi };

export function createTypeStyles(
  options: NamingPartial & {
    layers?: CascadeLayersObjectInput | readonly string[];
    tokenLayer?: string;
  },
): { styles: StylesApi | StylesApiWithLayers<string>; tokens: TokensApi } {
  const { layers, tokenLayer, ...rest } = options;

  if (layers != null) {
    if (tokenLayer === undefined) {
      throw new Error(
        '[typestyles] `createTypeStyles({ layers })` requires `tokenLayer` — the layer for `:root` and theme CSS.',
      );
    }
    const styles = createStyles({ ...rest, layers, tokenLayer });
    const tokens = createTokens({ scopeId: rest.scopeId, layers, tokenLayer });
    return { styles, tokens };
  }

  if (tokenLayer !== undefined) {
    throw new Error(
      '[typestyles] `createTypeStyles`: `tokenLayer` is only valid together with `layers`.',
    );
  }

  const styles = createStyles(rest);
  const tokens = createTokens({ scopeId: rest.scopeId });
  return { styles, tokens };
}
