export type GenerateGeometricScaleOptions = {
  /** Anchor value at offset `0` (unitless — the caller appends px/rem/ms/…). */
  base: number;
  /** Multiplier applied per step offset. Must be a finite number > 0. */
  ratio: number;
  /** Signed integer offsets from the base, e.g. `[-2, -1, 0, 1, 2]`. */
  steps: number[];
  /** Rounding function applied to each value. Defaults to `Math.round`. */
  round?: (n: number) => number;
};

export type GenerateLinearScaleOptions = {
  /** Base unit multiplied by each step ordinal (unitless). */
  base: number;
  /** Scaling factor applied on top of `base * step`. `0` is allowed (all zeros). */
  multiplier: number;
  /** Ordinal multipliers, e.g. `[1, 2, 3, 4]`. */
  steps: number[];
  /** Rounding function applied to each value. Defaults to `Math.round`. */
  round?: (n: number) => number;
};

export type ExpandDurationBandOptions = {
  /** Anchor duration (unitless, typically ms). Passed through unchanged. */
  base: number;
  /** Band ratio: `min = base * ratio`, `max = base / ratio`. Must be > 0. */
  ratio: number;
  /** Rounding granularity for `min`/`max` (nearest multiple). Defaults to `5`. */
  roundTo?: number;
};

export type DurationBand = { min: number; base: number; max: number };

function assertFiniteNumber(name: string, fn: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(
      `[typestyles] ${fn}: \`${name}\` must be a finite number, got ${String(value)}.`,
    );
  }
}

function assertPositive(name: string, fn: string, value: number): void {
  assertFiniteNumber(name, fn, value);
  if (value <= 0) {
    throw new Error(
      `[typestyles] ${fn}: \`${name}\` must be greater than 0, got ${String(value)}.`,
    );
  }
}

/**
 * Geometric (modular) scale: `value(offset) = round(base * ratio ** offset)` for each
 * signed integer offset in `steps`. Returns numbers in the same order as `steps`, with
 * zero naming opinions — zipping names onto steps is the caller's concern.
 */
export function generateGeometricScale(opts: GenerateGeometricScaleOptions): number[] {
  const { base, ratio, steps, round = Math.round } = opts;
  assertFiniteNumber('base', 'generateGeometricScale', base);
  assertPositive('ratio', 'generateGeometricScale', ratio);
  return steps.map((offset) => {
    if (!Number.isInteger(offset)) {
      throw new Error(
        `[typestyles] generateGeometricScale: \`steps\` must contain signed integer offsets, got ${String(offset)}.`,
      );
    }
    return round(base * ratio ** offset);
  });
}

/**
 * Linear scale: `value(step) = round(base * step * multiplier)` for each ordinal in
 * `steps`. Deliberately minimal — it exists for a rounding/unit convention, not math.
 */
export function generateLinearScale(opts: GenerateLinearScaleOptions): number[] {
  const { base, multiplier, steps, round = Math.round } = opts;
  assertFiniteNumber('base', 'generateLinearScale', base);
  assertFiniteNumber('multiplier', 'generateLinearScale', multiplier);
  return steps.map((step) => {
    assertFiniteNumber('steps[]', 'generateLinearScale', step);
    return round(base * step * multiplier);
  });
}

/**
 * Expand a single duration anchor into a `{ min, base, max }` band:
 * `min = round(base * ratio, roundTo)`, `max = round(base / ratio, roundTo)`;
 * `base` passes through unchanged. `roundTo` defaults to the nearest 5 (ms) so
 * computed bands stay perceptually clean instead of visibly computed (e.g. 93.75).
 */
export function expandDurationBand(opts: ExpandDurationBandOptions): DurationBand {
  const { base, ratio, roundTo = 5 } = opts;
  assertFiniteNumber('base', 'expandDurationBand', base);
  assertPositive('ratio', 'expandDurationBand', ratio);
  assertPositive('roundTo', 'expandDurationBand', roundTo);
  const roundToNearest = (n: number) => Math.round(n / roundTo) * roundTo;
  return {
    min: roundToNearest(base * ratio),
    base,
    max: roundToNearest(base / ratio),
  };
}
