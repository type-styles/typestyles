import {
  getLiveDemoSpec,
  variantsFromModule,
  type LiveDemoModule,
  type LiveDemoSpec,
  type LiveDemoVariant,
} from '../demos/registry';
import { collectDemoCss } from './collectDemoCss';
import { filterCssForDemo } from './filterDemoCss';
import { formatDemoCss } from './formatDemoCss';

export type ResolvedLiveDemo = {
  spec: LiveDemoSpec;
  code: string;
  usageCode?: string;
  usageLang: string;
  usageLabel?: string;
  cardClassName?: string;
  /** Full extracted CSS for the demo preview (injected when not in the site entry). */
  previewCss?: string;
  variants: Array<LiveDemoVariant & { css: string }>;
};

export async function resolveLiveDemo(id: string): Promise<ResolvedLiveDemo> {
  const spec = getLiveDemoSpec(id);
  if (!spec) {
    throw new Error(`Unknown live demo id: ${id}`);
  }

  const fullCss = await collectDemoCss(spec.modulePath);
  const mod = (await spec.load()) as LiveDemoModule;
  const variants = variantsFromModule(spec, mod).map((variant) => ({
    ...variant,
    css: formatDemoCss(
      filterCssForDemo(fullCss, [variant.className, variant.themeClass].filter(Boolean).join(' '), {
        tokenPrefix: spec.tokenPrefix,
        includeThemeRules: spec.includeThemeRules,
      }),
    ),
  }));

  return {
    spec,
    code: mod.demoSourceCode,
    usageCode: mod.demoUsageCode,
    usageLang: mod.demoUsageLang ?? spec.usageLang ?? 'typescript',
    usageLabel: mod.demoUsageLabel ?? spec.usageLabel,
    cardClassName: mod.cardClassName,
    previewCss: spec.previewCss ? fullCss : undefined,
    variants,
  };
}
