import type {
  PropertyCollection,
  PropsFunction,
  PropertyDefinitions,
  ConditionDefinitions,
  ShorthandDefinitions,
} from './types';
import { insertRules } from 'typestyles';
import { generateFromCollections } from './generate';
import { buildLookupMap, createResolver } from './runtime';

/**
 * Combine property collections into a typed props function with pre-generated CSS.
 *
 * @example
 * ```ts
 * const props = createProps('atoms', responsiveProps, colorProps);
 *
 * // Type-safe usage
 * props({
 *   display: 'flex',
 *   padding: 2,
 *   paddingTop: { mobile: 3 },
 * });
 * // Returns: "atoms-display-flex atoms-padding-2 atoms-paddingTop-mobile-3"
 * ```
 */
export function createProps<
  Collections extends PropertyCollection<
    PropertyDefinitions,
    ConditionDefinitions,
    ShorthandDefinitions<PropertyDefinitions>
  >[],
>(namespace: string, ...collections: Collections): PropsFunction<Collections> {
  // Generate all CSS rules upfront
  const cssRules = generateFromCollections(namespace, collections);

  // Inject CSS
  insertRules(cssRules);

  // Build runtime lookup
  const { propertyMap, conditionKeys, shorthands } = buildLookupMap(namespace, collections);

  // Create resolver function
  const resolver = createResolver(namespace, propertyMap, conditionKeys, shorthands);

  // Create properties set for inspection
  const properties = new Set<string>();
  for (const collection of collections) {
    for (const prop of Object.keys(collection.properties)) {
      properties.add(prop);
    }
    for (const shorthand of Object.keys(collection.shorthands)) {
      properties.add(shorthand);
    }
  }

  // Attach properties to the function
  const propsFunction = Object.assign(resolver, { properties });

  return propsFunction as PropsFunction<Collections>;
}
