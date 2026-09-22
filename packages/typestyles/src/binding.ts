import type { ComponentAttrsResult } from './types';
import { cx, devWarnOnce, isComponentAttrsResult } from './cx';

export type RecipeInput = string | ComponentAttrsResult;

type ClassNamePart = string | false | null | undefined;
type CombinePart = RecipeInput | false | null | undefined;

/**
 * Merge a recipe result (or plain class string) with optional extra class names,
 * returning a flat props bag suitable for DOM spread.
 */
export function mergeProps(
  result: RecipeInput,
  ...classNames: Array<ClassNamePart>
): Record<string, string> {
  if (typeof result === 'string') {
    return { className: cx(result, ...classNames) };
  }
  return { ...result.attrs, className: cx(result.className, ...classNames) };
}

function isCombineOptions(value: unknown): value is { className?: ClassNamePart } {
  if (typeof value !== 'object' || value === null || isComponentAttrsResult(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 0 || (keys.length === 1 && keys[0] === 'className');
}

function collectCombineParts(
  parts: CombinePart[],
  options?: { className?: ClassNamePart },
): Record<string, string> {
  const classNames: string[] = [];
  const mergedAttrs: Record<string, string> = {};
  let partsWithAttrs = 0;

  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      classNames.push(part);
      continue;
    }

    classNames.push(part.className);
    const attrKeys = Object.keys(part.attrs);
    if (attrKeys.length > 0) partsWithAttrs += 1;
    for (const key of attrKeys) {
      const value = part.attrs[key];
      if (key in mergedAttrs && mergedAttrs[key] !== value) {
        devWarnOnce(
          `combine() "${key}" conflict: "${mergedAttrs[key]}" vs "${value}" — last wins.`,
        );
      }
      mergedAttrs[key] = value;
    }
  }

  if (partsWithAttrs > 1) {
    devWarnOnce(
      'combine() merged attrs from multiple slots — prefer separate elements when attrs differ.',
    );
  }

  return {
    ...mergedAttrs,
    className: cx(...classNames, options?.className),
  };
}

/**
 * Merge multiple recipe results onto a single element: union of class names and
 * compatible attribute keys.
 */
export function combine(...parts: CombinePart[]): Record<string, string>;
export function combine(
  ...args: [...CombinePart[], { className?: ClassNamePart }]
): Record<string, string>;
export function combine(
  ...args: (CombinePart | { className?: ClassNamePart })[]
): Record<string, string> {
  const last = args[args.length - 1];
  if (args.length > 0 && isCombineOptions(last)) {
    return collectCombineParts(args.slice(0, -1) as CombinePart[], last);
  }
  return collectCombineParts(args as CombinePart[]);
}
