import type { CSSProperties, FontFaceProps } from './types';
import { serializeStyle } from './css';
import { insertRules } from './sheet';
import type { CascadeLayersInput } from './layers';
import {
  applyLayerToRules,
  assertOwnLayer,
  resolveCascadeLayers,
  type ResolvedCascadeLayers,
} from './layers';
import { globalFontFace } from './global';
import type { GlobalStyleTuple } from './global-style-tuple';
import { parseGlobalStyleArgs } from './global-style-tuple';

type CreateGlobalOptions = {
  /** Prefixes inserted rule keys so globals from different bundles dedupe independently. */
  scopeId?: string;
};

type CreateGlobalWithLayers = CreateGlobalOptions & {
  layers: CascadeLayersInput;
  /**
   * Default `@layer` for `style()` when the call (or recipe tuple) omits `{ layer }`.
   * Must be one of the stack’s own layer names (not a prepended framework layer).
   */
  globalLayer?: string;
};

export type GlobalApiUnlayered = {
  readonly cascadeLayers: undefined;
  style(tuple: GlobalStyleTuple): void;
  style(selector: string, properties: CSSProperties, options?: { layer?: string }): void;
  /** Apply multiple recipe tuples (e.g. {@link reset} from `typestyles/globals`). */
  apply(...tuples: GlobalStyleTuple[]): void;
  fontFace(family: string, props: FontFaceProps): void;
};

export type GlobalApiLayered = {
  readonly cascadeLayers: ResolvedCascadeLayers;
  style(tuple: GlobalStyleTuple): void;
  style(selector: string, properties: CSSProperties, options?: { layer?: string }): void;
  apply(...tuples: GlobalStyleTuple[]): void;
  fontFace(family: string, props: FontFaceProps): void;
};

export function createGlobal(options?: CreateGlobalOptions): GlobalApiUnlayered;

export function createGlobal(options: CreateGlobalWithLayers): GlobalApiLayered;

export function createGlobal(
  options?: CreateGlobalOptions | CreateGlobalWithLayers,
): GlobalApiUnlayered | GlobalApiLayered {
  const scopeId = options?.scopeId;
  const scopePrefix = scopeId != null && scopeId !== '' ? `g:${scopeId}:` : '';
  const layersOpt = options && 'layers' in options ? options.layers : undefined;
  const globalLayerDefault =
    options && 'layers' in options && 'globalLayer' in options ? options.globalLayer : undefined;

  const stack = layersOpt != null ? resolveCascadeLayers(layersOpt, scopeId) : undefined;

  if (stack && globalLayerDefault != null && globalLayerDefault !== '') {
    assertOwnLayer(stack, globalLayerDefault, 'createGlobal({ globalLayer })');
  }

  const style = (
    first: string | GlobalStyleTuple,
    second?: CSSProperties,
    third?: { layer?: string },
  ): void => {
    const { selector, properties, options: opts } = parseGlobalStyleArgs(first, second, third);

    const rules = serializeStyle(selector, properties).map((r) => ({
      ...r,
      key: scopePrefix + r.key,
    }));

    if (stack) {
      const layer = opts?.layer ?? globalLayerDefault;
      if (layer == null || layer === '') {
        throw new Error(
          '[typestyles] `global.style(..., { layer })` (or a recipe tuple with `{ layer }`) is required when using `createGlobal({ layers })` without `globalLayer`.',
        );
      }
      assertOwnLayer(stack, layer, `global.style('${selector}', …)`);
      insertRules(applyLayerToRules(rules, layer, stack));
      return;
    }

    if (process.env.NODE_ENV !== 'production' && opts?.layer != null) {
      console.warn(
        '[typestyles] `layer` in `global.style(..., { layer })` is ignored when `createGlobal()` was created without `layers`.',
      );
    }
    insertRules(rules);
  };

  const apply = (...tuples: GlobalStyleTuple[]): void => {
    for (const t of tuples) {
      style(t);
    }
  };

  return {
    cascadeLayers: stack,
    style,
    apply,
    fontFace: globalFontFace,
  } as GlobalApiUnlayered | GlobalApiLayered;
}
