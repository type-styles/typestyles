import type {
  PropertyDefinitions,
  ConditionDefinitions,
  ShorthandDefinitions,
  PropertyCollection,
} from './types';
import { sanitizeValue, isConditionalValue } from './utils';

/**
 * Build a lookup map for runtime class name resolution.
 */
export function buildLookupMap<
  P extends PropertyDefinitions,
  C extends ConditionDefinitions,
  S extends ShorthandDefinitions<P>,
>(
  _namespace: string,
  collections: PropertyCollection<P, C, S>[],
): {
  propertyMap: Map<string, Set<string>>;
  conditionKeys: Set<string>;
  shorthands: Map<string, string[]>;
} {
  const propertyMap = new Map<string, Set<string>>();
  const conditionKeys = new Set<string>();
  const shorthands = new Map<string, string[]>();

  for (const collection of collections) {
    // Collect properties
    for (const property of Object.keys(collection.properties)) {
      if (!propertyMap.has(property)) {
        propertyMap.set(property, new Set());
      }
    }

    // Collect conditions
    for (const condition of Object.keys(collection.conditions)) {
      conditionKeys.add(condition);
    }

    // Collect shorthands
    for (const [shorthand, props] of Object.entries(collection.shorthands)) {
      shorthands.set(shorthand, props as string[]);
    }
  }

  return { propertyMap, conditionKeys, shorthands };
}

/**
 * Expand shorthands in props object.
 */
export function expandShorthands(
  props: Record<string, unknown>,
  shorthands: Map<string, string[]>,
): Record<string, unknown> {
  const expanded: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (shorthands.has(key)) {
      // Expand shorthand
      const properties = shorthands.get(key)!;
      for (const prop of properties) {
        expanded[prop] = value;
      }
    } else {
      // Regular property
      expanded[key] = value;
    }
  }

  return expanded;
}

/**
 * Resolve a single property value to class names.
 */
function resolveValue(
  namespace: string,
  property: string,
  value: unknown,
  conditionKeys: Set<string>,
): string[] {
  const classNames: string[] = [];

  if (isConditionalValue(value, conditionKeys)) {
    // Conditional value: { mobile: 'flex', desktop: 'block' }
    for (const [condition, condValue] of Object.entries(value)) {
      if (conditionKeys.has(condition)) {
        const sanitized = sanitizeValue(String(condValue));
        classNames.push(`${namespace}-${property}-${condition}-${sanitized}`);
      }
    }
  } else {
    // Direct value: 'flex' or 2
    const sanitized = sanitizeValue(String(value));
    classNames.push(`${namespace}-${property}-${sanitized}`);
  }

  return classNames;
}

/**
 * Create a runtime resolver function.
 */
export function createResolver(
  namespace: string,
  _propertyMap: Map<string, Set<string>>,
  conditionKeys: Set<string>,
  shorthands: Map<string, string[]>,
): (props: Record<string, unknown>) => string {
  return (props: Record<string, unknown>): string => {
    // Expand shorthands
    const expanded = expandShorthands(props, shorthands);

    const classNames: string[] = [];

    for (const [property, value] of Object.entries(expanded)) {
      if (value == null) continue;

      const resolved = resolveValue(namespace, property, value, conditionKeys);
      classNames.push(...resolved);
    }

    return classNames.join(' ');
  };
}
