import type {
  ThemeComponentOverrideEntry,
  ThemeConfig,
  ThemeOverrideContext,
  Theme,
} from './types';
import type { ComponentRegistryApi } from './component-registry';
import type { OverrideFn } from './override';
import type { ThemeTokenContext } from './theme-token-context';

export type { ThemeOverrideContext };

export type ThemeComponentOverrides = NonNullable<ThemeConfig['components']>;

export type ThemeComponentsBridge = ComponentRegistryApi & {
  readonly override: OverrideFn;
};

export function applyThemeComponentOverrides(
  surface: Theme,
  components: ThemeComponentOverrides | undefined,
  tokens: ThemeTokenContext,
  styles: ThemeComponentsBridge,
): void {
  if (!components) return;

  const themeable = styles.getThemeableComponents();
  const ctx: ThemeOverrideContext = { tokens, theme: surface };

  for (const [namespace, entry] of Object.entries(components)) {
    const handle = styles.getComponent(namespace);
    if (!handle) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          `[typestyles] createTheme: unknown component namespace "${namespace}". ` +
            `Register the recipe with recipe('${namespace}', …) on the same createTypeStyles instance.`,
        );
      }
      continue;
    }
    if (!themeable.has(namespace)) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          `[typestyles] createTheme: component "${namespace}" is not themeable ` +
            `(recipe(..., { themeable: false })).`,
        );
      }
      continue;
    }

    const config = typeof entry === 'function' ? entry(ctx) : entry;
    const overrideForTheme = styles.override as (
      component: object,
      config: ThemeComponentOverrideEntry,
      options?: { selectorPrefix?: string },
    ) => void;
    overrideForTheme(handle, config, {
      selectorPrefix: `.${surface.className}`,
    });
  }
}
