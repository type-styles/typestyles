import { discoverDefaultExtractModules } from './discover';

export type TypestylesIntegrationMode = 'runtime' | 'build' | 'hybrid';

export interface TypestylesExtractOptions {
  /**
   * Modules that register typestyles styles, relative to the project root.
   * When omitted, uses {@link discoverDefaultExtractModules}.
   */
  modules?: string[];
  /**
   * Output CSS filename. Defaults to `typestyles.css`.
   */
  fileName?: string;
  /**
   * Additional module that re-exports {@link getRegisteredComponentRefs} (or an
   * equivalent object of every themeable recipe handle) so extract bundles retain
   * full design-system CSS without a hand-maintained registry file.
   */
  registeredComponentsModule?: string;
  /**
   * When `"allRegisteredComponents"`, same as setting
   * {@link registeredComponentsModule} to the first resolved extract module
   * (typically your `createTypeStyles` entry).
   */
  include?: 'allRegisteredComponents';
}

/**
 * Resolve extraction modules from explicit config or convention entry discovery.
 */
export function resolveExtractModules(
  root: string,
  extract: TypestylesExtractOptions | undefined,
): string[] {
  let modules: string[];
  if (extract?.modules !== undefined) {
    modules = [...extract.modules];
  } else {
    modules = discoverDefaultExtractModules(root);
  }

  const registered =
    extract?.registeredComponentsModule ??
    (extract?.include === 'allRegisteredComponents' ? modules[0] : undefined);
  if (registered && !modules.includes(registered)) {
    modules.push(registered);
  }

  return modules;
}

/**
 * Default to `build` when at least one extraction module resolves; otherwise `runtime`.
 */
export function resolveExtractMode(
  explicitMode: TypestylesIntegrationMode | undefined,
  resolvedModules: string[],
): TypestylesIntegrationMode {
  return explicitMode ?? (resolvedModules.length > 0 ? 'build' : 'runtime');
}
