import { createStyles } from 'typestyles';

const styles = createStyles();

export const button = styles.component('variant-button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#1f2937' },
    },
    size: {
      sm: { padding: '6px 10px', fontSize: '14px' },
      lg: { padding: '10px 16px', fontSize: '16px' },
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'sm',
  },
});

export const demoSourceCode = `import { createStyles } from 'typestyles';

const styles = createStyles();

const button = styles.component('variant-button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#1f2937' },
    },
    size: {
      sm: { padding: '6px 10px', fontSize: '14px' },
      lg: { padding: '10px 16px', fontSize: '16px' },
    },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
});`;

export const demoVariants = [
  {
    id: 'default',
    label: 'Default',
    className: button(),
    usageCode: `button();
// → "${button()}"`,
    usageLang: 'typescript',
  },
  {
    id: 'ghost-lg',
    label: 'Ghost · large',
    className: button({ intent: 'ghost', size: 'lg' }),
    usageCode: `button({ intent: 'ghost', size: 'lg' });
// → "${button({ intent: 'ghost', size: 'lg' })}"`,
    usageLang: 'typescript',
  },
] as const;
