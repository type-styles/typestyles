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
}

/**
 * Resolve extraction modules from explicit config or convention entry discovery.
 */
export function resolveExtractModules(
  root: string,
  extract: TypestylesExtractOptions | undefined,
): string[] {
  if (extract?.modules !== undefined) {
    return extract.modules;
  }
  return discoverDefaultExtractModules(root);
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
