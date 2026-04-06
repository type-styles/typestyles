import type {
  PropertyDefinitions,
  ConditionDefinitions,
  PropertyCollection,
  ConditionDefinition,
  PropertyValues,
  ShorthandDefinitions,
} from './types';
import { sanitizeValue, toKebabCase } from './utils';

/**
 * Generate a single atomic CSS class.
 */
function generateAtomicClass(
  namespace: string,
  property: string,
  valueKey: string,
  cssValue: string | number,
  condition?: ConditionDefinition & { name: string },
): { key: string; css: string } {
  const sanitizedValue = sanitizeValue(valueKey);
  const className = condition
    ? `${namespace}-${property}-${condition.name}-${sanitizedValue}`
    : `${namespace}-${property}-${sanitizedValue}`;

  const kebabProp = toKebabCase(property);
  const declaration = `${kebabProp}: ${cssValue}`;

  if (!condition) {
    return {
      key: `.${className}`,
      css: `.${className} { ${declaration}; }`,
    };
  }

  // Handle media queries
  if (condition['@media']) {
    const mediaQuery = `@media ${condition['@media']}`;
    return {
      key: `${mediaQuery}:.${className}`,
      css: `${mediaQuery} { .${className} { ${declaration}; } }`,
    };
  }

  // Handle container queries
  if (condition['@container']) {
    const containerQuery = `@container ${condition['@container']}`;
    return {
      key: `${containerQuery}:.${className}`,
      css: `${containerQuery} { .${className} { ${declaration}; } }`,
    };
  }

  // Handle @supports
  if (condition['@supports']) {
    const supportsQuery = `@supports ${condition['@supports']}`;
    return {
      key: `${supportsQuery}:.${className}`,
      css: `${supportsQuery} { .${className} { ${declaration}; } }`,
    };
  }

  // Handle custom selectors
  if (condition.selector) {
    const wrappedSelector = condition.selector.replace(/&/g, `.${className}`);
    return {
      key: wrappedSelector,
      css: `${wrappedSelector} { ${declaration}; }`,
    };
  }

  // Fallback to no condition
  return {
    key: `.${className}`,
    css: `.${className} { ${declaration}; }`,
  };
}

/**
 * Get CSS value entries from PropertyValues.
 */
function getValueEntries(values: PropertyValues): Array<[string, string | number]> {
  if (Array.isArray(values)) {
    // Array format: ['flex', 'block'] -> [['flex', 'flex'], ['block', 'block']]
    return values.map((v) => [v, v]);
  } else {
    // Object format: { 0: '0', 1: '4px' } -> [['0', '0'], ['1', '4px']]
    return Object.entries(values);
  }
}

/**
 * Generate all atomic CSS classes for a property collection.
 */
export function generateAllAtomicClasses<
  P extends PropertyDefinitions,
  C extends ConditionDefinitions,
>(
  namespace: string,
  properties: P,
  conditions: C,
  defaultCondition: keyof C | false,
): Array<{ key: string; css: string }> {
  const rules: Array<{ key: string; css: string }> = [];

  for (const [property, values] of Object.entries(properties)) {
    const valueEntries = getValueEntries(values);

    for (const [valueKey, cssValue] of valueEntries) {
      // Generate base class (no condition or with default condition)
      if (defaultCondition === false) {
        rules.push(generateAtomicClass(namespace, property, valueKey, cssValue));
      } else {
        const condition = conditions[defaultCondition as string];
        if (condition) {
          rules.push(
            generateAtomicClass(namespace, property, valueKey, cssValue, {
              ...condition,
              name: defaultCondition as string,
            }),
          );
        }
      }

      // Generate conditional variants
      for (const [condName, condDef] of Object.entries(conditions)) {
        // Skip if this is the default condition and we already generated it
        if (defaultCondition !== false && condName === defaultCondition) {
          continue;
        }

        rules.push(
          generateAtomicClass(namespace, property, valueKey, cssValue, {
            ...condDef,
            name: condName,
          }),
        );
      }
    }
  }

  return rules;
}

/**
 * Generate all atomic CSS classes from multiple property collections.
 */
export function generateFromCollections(
  namespace: string,
  collections: PropertyCollection<
    PropertyDefinitions,
    ConditionDefinitions,
    ShorthandDefinitions<PropertyDefinitions>
  >[],
): Array<{ key: string; css: string }> {
  const allRules: Array<{ key: string; css: string }> = [];

  for (const collection of collections) {
    const rules = generateAllAtomicClasses(
      namespace,
      collection.properties,
      collection.conditions,
      collection.defaultCondition,
    );
    allRules.push(...rules);
  }

  return allRules;
}
