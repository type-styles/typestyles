/**
 * Compile-only fixtures (included in `tsc --noEmit`, not shipped in the bundle entry).
 * Verifies CSS primitive property types compose correctly.
 */
import type {
  ComponentConfigContext,
  ComponentVarSchema,
  PropertyOptions,
  PropertyRef,
  PropertyRegistration,
  StylesPropertyFn,
} from './types';

export function _propertyRegistrationShape(): PropertyRegistration {
  return { syntax: '<color>', inherits: false, initial: 'transparent' };
}

export function _propertyOptionsShape(): PropertyOptions {
  return { syntax: '<length>', value: 8, inherits: true };
}

export function _stylesPropertyFnShape(fn: StylesPropertyFn): PropertyRef {
  const ref = fn('accent', { syntax: '<color>', value: 'red' });
  fn.declare('accent', { syntax: '<color>' });
  fn.set(ref, 'blue');
  return ref;
}

export function _componentConfigContextShape(ctx: ComponentConfigContext): PropertyRef {
  const ref = ctx.var('gap', { syntax: '<length>', value: 8 });
  ctx.var.declare('radius', { syntax: '<length-percentage>' });
  ctx.vars({ gap: { syntax: '<length>', value: 8 } });
  ctx.vars.declare({ accent: { syntax: '<color>' } } satisfies ComponentVarSchema);
  return ref;
}
