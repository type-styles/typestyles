import type { CSSProperties } from './types';
import type { GlobalStyleTuple } from './global-style-tuple';

export type { GlobalStyleTuple } from './global-style-tuple';

/** Options for {@link reset} (Josh Comeau’s custom CSS reset). */
export type JoshComeauResetOptions = {
  /**
   * Include `#root, #__next { isolation: isolate }` from the
   * [original reset](https://www.joshwcomeau.com/css/custom-css-reset/).
   * @default true
   */
  includeAppRootIsolation?: boolean;
  /**
   * When set, each tuple includes `{ layer }` so the reset works with
   * `createGlobal({ layers })` / `createTypeStyles({ layers })` without a factory `globalLayer`.
   */
  layer?: string;
};

function withLayer(
  tuple: readonly [string, CSSProperties],
  layer: string | undefined,
): GlobalStyleTuple {
  if (layer == null || layer === '') {
    return tuple;
  }
  return [tuple[0], tuple[1], { layer }];
}

/**
 * [Josh Comeau’s custom CSS reset](https://www.joshwcomeau.com/css/custom-css-reset/) as an array of
 * {@link GlobalStyleTuple}s — use with `global.apply(...reset())` or call `global.style` per tuple.
 *
 * With cascade layers, pass `{ layer: 'reset' }` (or your baseline layer) so these rules stay below
 * component layers — or set `globalLayer` on `createTypeStyles` / `createGlobal` and omit `layer` here.
 *
 * Released into the public domain by the author; this port keeps the same rules for convenience.
 *
 * @example
 * ```ts
 * import { createTypeStyles } from 'typestyles';
 * import { reset } from 'typestyles/globals';
 *
 * const { global } = createTypeStyles({
 *   layers: ['reset', 'tokens', 'components'] as const,
 *   tokenLayer: 'tokens',
 *   globalLayer: 'reset',
 * });
 * global.apply(...reset({ includeAppRootIsolation: false }));
 * ```
 */
export function reset(options?: JoshComeauResetOptions): readonly GlobalStyleTuple[] {
  const layer = options?.layer;
  const includeAppRoot = options?.includeAppRootIsolation !== false;

  const htmlInterpolate: CSSProperties = {
    '@media (prefers-reduced-motion: no-preference)': {
      interpolateSize: 'allow-keywords',
    } as CSSProperties,
  };

  const out: GlobalStyleTuple[] = [
    withLayer(['*, *::before, *::after', { boxSizing: 'border-box' }], layer),
    withLayer(['*:not(dialog)', { margin: 0 }], layer),
    withLayer(['html', htmlInterpolate], layer),
    withLayer(
      [
        'body',
        {
          lineHeight: 1.5,
          WebkitFontSmoothing: 'antialiased',
        },
      ],
      layer,
    ),
    withLayer(
      [
        'img, picture, video, canvas, svg',
        {
          display: 'block',
          maxWidth: '100%',
        },
      ],
      layer,
    ),
    withLayer(
      [
        'input, button, textarea, select',
        {
          font: 'inherit',
        },
      ],
      layer,
    ),
    withLayer(
      [
        'p, h1, h2, h3, h4, h5, h6',
        {
          overflowWrap: 'break-word',
        },
      ],
      layer,
    ),
    withLayer(['p', { textWrap: 'pretty' } as CSSProperties], layer),
    withLayer(['h1, h2, h3, h4, h5, h6', { textWrap: 'balance' } as CSSProperties], layer),
  ];

  if (includeAppRoot) {
    out.push(withLayer(['#root, #__next', { isolation: 'isolate' }], layer));
  }

  return out;
}

/** `box-sizing: border-box` on the universal selector (safe with layered component padding). */
export function boxSizing(): GlobalStyleTuple {
  return ['*, *::before, *::after', { boxSizing: 'border-box' }];
}

/** Alias of {@link boxSizing}. */
export const borderBox = boxSizing;

/** Styles applied to `body` (e.g. margin reset, background, base font). */
export function body(properties: CSSProperties, options?: { layer?: string }): GlobalStyleTuple {
  return options != null ? ['body', properties, options] : ['body', properties];
}

/** `::selection` colors. */
export function selection(
  properties: CSSProperties,
  options?: { layer?: string },
): GlobalStyleTuple {
  return options != null ? ['::selection', properties, options] : ['::selection', properties];
}

/** Styles on the `html` element (e.g. font smoothing, scroll behavior). */
export function html(properties: CSSProperties, options?: { layer?: string }): GlobalStyleTuple {
  return options != null ? ['html', properties, options] : ['html', properties];
}
