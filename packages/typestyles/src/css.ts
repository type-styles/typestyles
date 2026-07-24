import type { PropertyRegistration, PropertyRef } from './types';
import { createRegisteredPropertyRef, registerAtPropertySchema } from './registered-property';
import { registerCustomProperty, registerCustomProperties } from './custom-properties';

function assertCustomPropName(name: string): asserts name is `--${string}` {
  if (!name.startsWith('--')) {
    throw new Error(`[typestyles] Custom property name must start with "--" — got "${name}".`);
  }
}

export const css = {
  atProperty(name: `--${string}`, registration: PropertyRegistration): PropertyRef {
    assertCustomPropName(name);
    registerAtPropertySchema(name, registration);
    return createRegisteredPropertyRef(name);
  },

  customProperty(
    name: `--${string}`,
    value: string | number,
    options?: { selector?: string },
  ): void {
    assertCustomPropName(name);
    registerCustomProperty(name, String(value), options?.selector ?? ':root');
  },

  customProperties(selector: string, properties: Record<`--${string}`, string | number>): void {
    const normalized: Record<string, string> = {};
    for (const [name, value] of Object.entries(properties)) {
      assertCustomPropName(name);
      normalized[name] = String(value);
    }
    registerCustomProperties(selector, normalized);
  },

  var(name: `--${string}`): PropertyRef {
    assertCustomPropName(name);
    return createRegisteredPropertyRef(name);
  },
} as const;
