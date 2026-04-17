import type { CSSProperties } from './types';

/**
 * Return type of helpers in `typestyles/globals`, passed to `global.style(…)`.
 *
 * @example
 * ```ts
 * global.style(boxSizing());
 * global.style(body({ margin: 0 }, { layer: 'components' }));
 * ```
 */
export type GlobalStyleTuple =
  | readonly [selector: string, properties: CSSProperties]
  | readonly [selector: string, properties: CSSProperties, options: { layer?: string }];

export function parseGlobalStyleArgs(
  first: string | GlobalStyleTuple,
  second?: CSSProperties,
  third?: { layer?: string },
): { selector: string; properties: CSSProperties; options?: { layer?: string } } {
  if (Array.isArray(first)) {
    const t = first as readonly unknown[];
    if (t.length < 2 || t.length > 3) {
      throw new Error(
        '[typestyles] global.style(…) recipe tuple must be [selector, properties] or [selector, properties, { layer }].',
      );
    }
    const selector = t[0];
    const properties = t[1];
    if (typeof selector !== 'string') {
      throw new Error(
        '[typestyles] global.style(…) recipe tuple must start with a selector string.',
      );
    }
    if (typeof properties !== 'object' || properties === null || Array.isArray(properties)) {
      throw new Error(
        '[typestyles] global.style(…) recipe tuple must use a style object as the second element.',
      );
    }
    if (t.length === 3) {
      const opts = t[2];
      if (typeof opts !== 'object' || opts === null || Array.isArray(opts)) {
        throw new Error(
          '[typestyles] global.style(…) recipe tuple optional third element must be `{ layer?: string }`.',
        );
      }
      return {
        selector,
        properties: properties as CSSProperties,
        options: opts as { layer?: string },
      };
    }
    return { selector, properties: properties as CSSProperties, options: undefined };
  }

  if (typeof first !== 'string' || second === undefined) {
    throw new Error(
      '[typestyles] global.style(…) expected `(selector, properties)` or a recipe tuple from `typestyles/globals`.',
    );
  }

  return { selector: first, properties: second, options: third };
}
