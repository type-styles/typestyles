export type LiveDemoVariant = {
  id: string;
  label: string;
  className: string;
  themeClass?: string;
  usageCode?: string;
  usageLang?: string;
};

export type LiveDemoModule = {
  demoSourceCode: string;
  demoVariants: readonly LiveDemoVariant[];
  cardClassName?: string;
  demoUsageCode?: string;
  demoUsageLang?: string;
  demoUsageLabel?: string;
};

export type LiveDemoSpec = {
  title: string;
  headerLabel: string;
  codeLang: string;
  usageLabel?: string;
  usageLang?: string;
  /** Path relative to the docs package root for build-time CSS extraction. */
  modulePath: string;
  /** When true, inject `modulePath` CSS into the demo preview (isolated from site entry). */
  previewCss?: boolean;
  tokenPrefix?: string;
  includeThemeRules?: boolean;
  preview: 'button' | 'themed-card';
  load: () => Promise<LiveDemoModule>;
};

export const liveDemoRegistry: Record<string, LiveDemoSpec> = {
  'getting-started-button': {
    title: 'Scoped button + tokens',
    headerLabel: 'app/typestyles.ts',
    codeLang: 'typescript',
    modulePath: 'src/demos/getting-started-button.impl.ts',
    previewCss: true,
    tokenPrefix: '--app-color-',
    preview: 'button',
    usageLabel: 'Button.tsx',
    usageLang: 'tsx',
    load: () => import('./getting-started-button'),
  },
  'components-variants': {
    title: 'Dimensioned variants',
    headerLabel: 'button.ts',
    codeLang: 'typescript',
    modulePath: 'src/demos/components-variants.ts',
    preview: 'button',
    usageLang: 'typescript',
    load: () => import('./components-variants'),
  },
  'theming-light-dark': {
    title: 'Light / dark theme surface',
    headerLabel: 'tokens.ts',
    codeLang: 'typescript',
    modulePath: 'src/demos/theming-light-dark.ts',
    tokenPrefix: '--color-',
    includeThemeRules: true,
    preview: 'themed-card',
    load: () => import('./theming-light-dark'),
  },
};

export function getLiveDemoSpec(id: string): LiveDemoSpec | undefined {
  return liveDemoRegistry[id];
}

export function variantsFromModule(spec: LiveDemoSpec, mod: LiveDemoModule): LiveDemoVariant[] {
  if (spec.preview === 'themed-card' && mod.cardClassName) {
    return mod.demoVariants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      className: mod.cardClassName!,
      themeClass: variant.themeClass,
    }));
  }
  return mod.demoVariants.map((variant) => ({ ...variant }));
}
