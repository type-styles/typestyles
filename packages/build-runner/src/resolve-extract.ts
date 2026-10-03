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
   * When `"allRegisteredComponents"`, extraction runs `getRegisteredComponentRefs(styles)`
   * against the **`styles` named export** of the first resolved extract module (typically
   * your `createTypeStyles` entry) so every registry namespace is retained in the bundle.
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

  const registeredModule = extract?.registeredComponentsModule;
  if (registeredModule && !modules.includes(registeredModule)) {
    modules.push(registeredModule);
  }

  return modules;
}

/**
 * Entry module whose `styles` export is passed to `getRegisteredComponentRefs` during extract
 * when {@link TypestylesExtractOptions.include} is `"allRegisteredComponents"`.
 */
export function resolveRegisteredComponentsFrom(
  extract: TypestylesExtractOptions | undefined,
  modules: string[],
): string | undefined {
  if (extract?.include !== 'allRegisteredComponents' || modules.length === 0) {
    return undefined;
  }
  return modules[0];
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
