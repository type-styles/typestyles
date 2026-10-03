import type { Compiler, NormalModule, WebpackPluginInstance } from 'webpack';
import {
  extractNamespaces,
  reportDuplicateNamespaces,
  resolveExtractMode,
  resolveExtractModules,
  runTypestylesBuild,
  TYPESTYLES_IMPORT_RE,
  type TypestylesExtractOptions,
  type TypestylesIntegrationMode,
} from '@typestyles/build-runner';

/** Re-export shared convention discovery (same paths as `@typestyles/vite`). */
export {
  DEFAULT_EXTRACT_MODULE_CANDIDATES,
  discoverDefaultExtractModules,
} from '@typestyles/build-runner';

export type { TypestylesExtractOptions };

export interface TypestylesWebpackPluginOptions {
  warnDuplicates?: boolean;
  mode?: TypestylesIntegrationMode;
  extract?: TypestylesExtractOptions;
  root?: string;
}

/**
 * webpack plugin for typestyles runtime + optional static extraction.
 */
export default class TypestylesWebpackPlugin implements WebpackPluginInstance {
  private readonly warnDuplicates: boolean;
  private readonly mode?: TypestylesIntegrationMode;
  private readonly extract?: TypestylesExtractOptions;
  private readonly root: string;
  private readonly moduleNamespaces = new Map<string, { keys: string[]; prefixes: string[] }>();
  private readonly resolvedExtractModules: string[];
  private readonly resolvedMode: TypestylesIntegrationMode;

  constructor(options: TypestylesWebpackPluginOptions = {}) {
    this.warnDuplicates = options.warnDuplicates ?? true;
    this.mode = options.mode;
    this.extract = options.extract;
    this.root = options.root ?? process.cwd();
    this.resolvedExtractModules = resolveExtractModules(this.root, this.extract);
    this.resolvedMode = resolveExtractMode(this.mode, this.resolvedExtractModules);
  }

  apply(compiler: Compiler): void {
    if (this.resolvedMode === 'build' || this.resolvedMode === 'hybrid') {
      new compiler.webpack.DefinePlugin({
        __TYPESTYLES_RUNTIME_DISABLED__: JSON.stringify('true'),
      }).apply(compiler);
    }

    compiler.hooks.thisCompilation.tap('typestyles', (compilation) => {
      compilation.hooks.succeedModule.tap('typestyles', (module) => {
        const resource = (module as NormalModule).resource;
        if (!resource || !/\.[jt]sx?$/.test(resource) || resource.includes('node_modules')) {
          return;
        }

        const source = module.originalSource()?.source();
        const code = typeof source === 'string' ? source : source?.toString();
        if (!code || !TYPESTYLES_IMPORT_RE.test(code)) return;

        const { keys, prefixes } = extractNamespaces(code);
        if (keys.length === 0 && prefixes.length === 0) return;

        if (this.warnDuplicates) {
          reportDuplicateNamespaces(this.moduleNamespaces, resource, prefixes, {
            error(message) {
              compilation.errors.push(new Error(message));
            },
          });
        }

        this.moduleNamespaces.set(resource, { keys, prefixes });
      });

      if (this.resolvedMode === 'runtime' || !this.resolvedExtractModules.length) {
        return;
      }

      const fileName = this.extract?.fileName ?? 'typestyles.css';
      let cssPromise: Promise<string> | null = null;

      compilation.hooks.processAssets.tapPromise(
        {
          name: 'typestyles',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        async () => {
          try {
            if (!cssPromise) {
              cssPromise = runTypestylesBuild({
                root: this.root,
                modules: this.resolvedExtractModules,
              });
            }
            const css = await cssPromise;
            compilation.emitAsset(fileName, new compiler.webpack.sources.RawSource(css));
          } catch (error) {
            compilation.errors.push(
              new Error(
                `[typestyles] Failed to extract CSS: ${error instanceof Error ? error.message : String(error)}`,
              ),
            );
          }
        },
      );
    });
  }
}
