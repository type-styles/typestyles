import type {
  PropertyDefinitions,
  ConditionDefinitions,
  ShorthandDefinitions,
  DefinePropertiesConfig,
  PropertyCollection,
} from './types';

/**
 * Define a collection of CSS properties with their allowed values and optional conditions.
 *
 * @example
 * ```ts
 * const responsiveProps = defineProperties({
 *   conditions: {
 *     mobile: { '@media': '(min-width: 768px)' },
 *     desktop: { '@media': '(min-width: 1024px)' },
 *   },
 *   defaultCondition: false,
 *   properties: {
 *     display: ['flex', 'block', 'grid', 'none'],
 *     paddingTop: { 0: '0', 1: '4px', 2: '8px', 3: '16px' },
 *   },
 *   shorthands: {
 *     padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
 *   },
 * });
 * ```
 */
export function defineProperties<
  P extends PropertyDefinitions,
  C extends ConditionDefinitions = ConditionDefinitions,
  S extends ShorthandDefinitions<P> = Record<string, Array<keyof P>>,
>(config: DefinePropertiesConfig<P, C, S>): PropertyCollection<P, C, S> {
  const conditions = (config.conditions || {}) as C;
  const shorthands = (config.shorthands || {}) as S;
  const defaultCondition = config.defaultCondition ?? false;

  return {
    properties: config.properties,
    conditions,
    defaultCondition,
    shorthands,
  };
}
