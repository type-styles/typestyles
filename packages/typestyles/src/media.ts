import { atRuleBlock } from './at-rule-block';
import { toMediaAtRuleKey, type BreakpointMap } from './breakpoints';
import type { CSSProperties } from './types';

/**
 * Object key for nested viewport styles: `@media … { … }`.
 * Returned by {@link breakpoint} for typed media queries from configured breakpoints.
 */
export type MediaQueryKey = `@media ${string}`;

/** Viewport width/height feature for {@link breakpoint} / {@link media}. */
export type MediaBreakpointFeature = 'min' | 'max' | 'minHeight' | 'maxHeight';

/** Object form of {@link MediaBreakpointFeature} for {@link media}. */
export type MediaBreakpointOptions = {
  min?: boolean;
  max?: boolean;
  minHeight?: boolean;
  maxHeight?: boolean;
};

const FEATURE_CSS: Record<MediaBreakpointFeature, string> = {
  min: 'min-width',
  max: 'max-width',
  minHeight: 'min-height',
  maxHeight: 'max-height',
};

function normalizeFeatureArg(
  arg: MediaBreakpointFeature | MediaBreakpointOptions | undefined,
): MediaBreakpointFeature | undefined {
  if (arg == null) return undefined;
  if (typeof arg === 'string') return arg;
  if (arg.min) return 'min';
  if (arg.max) return 'max';
  if (arg.minHeight) return 'minHeight';
  if (arg.maxHeight) return 'maxHeight';
  return undefined;
}

type ParsedMediaCondition = {
  feature: string;
  value: string;
};

function parseMediaCondition(condition: string): ParsedMediaCondition | null {
  const trimmed = condition.trim();
  const match = trimmed.match(/^\(\s*([\w-]+)\s*:\s*(.+)\s*\)$/);
  if (match && match[1] && match[2]) {
    return { feature: match[1], value: match[2].trim() };
  }
  if (trimmed && !trimmed.includes('(')) {
    return { feature: 'min-width', value: trimmed };
  }
  return null;
}

function buildMediaCondition(feature: MediaBreakpointFeature, value: string): string {
  return `(${FEATURE_CSS[feature]}: ${value})`;
}

function requireBreakpoints(
  breakpoints: BreakpointMap | undefined,
): asserts breakpoints is BreakpointMap {
  if (!breakpoints) {
    throw new Error(
      '[typestyles] `breakpoint()` / `media()` require `breakpoints` on `createStyles` / `createTypeStyles`.',
    );
  }
}

function resolveBreakpointCondition(
  breakpoints: BreakpointMap,
  name: string,
  featureArg?: MediaBreakpointFeature,
): string {
  const condition = breakpoints[name];
  if (!condition) {
    throw new Error(
      `[typestyles] Unknown breakpoint "${name}". ` +
        `Registered breakpoints: ${Object.keys(breakpoints).join(', ') || '(none)'}.`,
    );
  }

  if (!featureArg) {
    return condition;
  }

  const parsed = parseMediaCondition(condition);
  if (!parsed) {
    return condition;
  }

  const targetFeature = FEATURE_CSS[featureArg];
  if (parsed.feature === targetFeature) {
    return `(${parsed.feature}: ${parsed.value})`;
  }

  return buildMediaCondition(featureArg, parsed.value);
}

export function resolveBreakpointMediaKey(
  breakpoints: BreakpointMap | undefined,
  name: string,
  featureArg?: MediaBreakpointFeature | MediaBreakpointOptions,
): MediaQueryKey {
  requireBreakpoints(breakpoints);
  const feature = normalizeFeatureArg(featureArg);
  const condition = resolveBreakpointCondition(breakpoints, name, feature);
  return toMediaAtRuleKey(condition);
}

export type BreakpointMediaFn<B extends BreakpointMap = BreakpointMap> = {
  <const K extends keyof B & string>(
    name: K,
    feature?: MediaBreakpointFeature | MediaBreakpointOptions,
  ): MediaQueryKey;
};

export type MediaFn<B extends BreakpointMap = BreakpointMap> = {
  <const K extends keyof B & string>(
    name: K,
    block: CSSProperties,
  ): Record<MediaQueryKey, CSSProperties>;
  <const K extends keyof B & string>(
    name: K,
    feature: MediaBreakpointFeature | MediaBreakpointOptions,
    block: CSSProperties,
  ): Record<MediaQueryKey, CSSProperties>;
};

export function createBreakpointMediaFn<const B extends BreakpointMap>(
  breakpoints: B | undefined,
): BreakpointMediaFn<B> {
  return ((name: string, featureArg?: MediaBreakpointFeature | MediaBreakpointOptions) =>
    resolveBreakpointMediaKey(breakpoints, name, featureArg)) as BreakpointMediaFn<B>;
}

export function createMediaFn<const B extends BreakpointMap>(
  breakpoints: B | undefined,
): MediaFn<B> {
  const breakpoint = createBreakpointMediaFn(breakpoints);

  return ((name: string, featureOrBlock: unknown, maybeBlock?: CSSProperties) => {
    if (maybeBlock !== undefined) {
      const feature = featureOrBlock as MediaBreakpointFeature | MediaBreakpointOptions;
      return atRuleBlock(breakpoint(name, feature), maybeBlock);
    }

    return atRuleBlock(breakpoint(name), featureOrBlock as CSSProperties);
  }) as MediaFn<B>;
}
