const RESERVED_CONFIG_KEYS = new Set([
  'base',
  'variants',
  'compoundVariants',
  'defaultVariants',
  'slots',
]);

export function splitVariantProps<P extends Record<string, unknown>>(
  props: P,
  variantKeys: readonly string[],
): {
  variants: Record<string, unknown>;
  rest: Omit<P, (typeof variantKeys)[number] | 'className' | 'css'>;
} {
  const variants: Record<string, unknown> = {};
  const rest = { ...props } as Record<string, unknown>;

  for (const key of variantKeys) {
    if (key in rest) {
      variants[key] = rest[key];
      delete rest[key];
    }
  }

  delete rest.className;
  delete rest.css;

  return {
    variants,
    rest: rest as Omit<P, (typeof variantKeys)[number] | 'className' | 'css'>,
  };
}

export function getVariantKeysFromConfig(
  config: Record<string, unknown> | ((ctx: unknown) => Record<string, unknown>),
): readonly string[] {
  if (typeof config === 'function') {
    return [];
  }

  if ('variants' in config && config.variants && typeof config.variants === 'object') {
    return Object.keys(config.variants);
  }

  return Object.keys(config).filter((key) => !RESERVED_CONFIG_KEYS.has(key));
}
