export type DesignColorValues = {
  background: { app: string; surface: string; subtle: string; elevated: string };
  text: { primary: string; secondary: string; onAccent: string; onDanger: string };
  accent: { default: string; hover: string };
  border: { default: string; strong: string; focus: string };
  danger: { default: string; solid: string };
  success: { default: string; solid: string };
  warning: { default: string; onSolid: string };
  info: { default: string; onSolid: string };
  overlay: { default: string };
};

export type DesignColorRefs = DesignColorValues & {
  text: DesignColorValues['text'] & { disabled: string; placeholder: string };
  accent: DesignColorValues['accent'] & { subtle: string };
  danger: DesignColorValues['danger'] & { subtle: string; border: string };
  success: DesignColorValues['success'] & { subtle: string; border: string };
  warning: DesignColorValues['warning'] & { subtle: string; border: string };
  info: DesignColorValues['info'] & { subtle: string; border: string };
  overlay: DesignColorValues['overlay'] & { backdrop: string };
};

export type DesignSyntaxValues = {
  base: string;
  keyword: string;
  title: string;
  attr: string;
  string: string;
  builtIn: string;
  comment: string;
  name: string;
  section: string;
  bullet: string;
  addition: string;
  additionBackground: string;
  deletion: string;
  deletionBackground: string;
};

export const defaultLightSyntaxValues: DesignSyntaxValues = {
  base: 'oklch(24.8% 0.008 264)',
  keyword: 'oklch(54.5% 0.24 301)',
  title: 'oklch(58.5% 0.22 248)',
  attr: 'oklch(50% 0.18 68)',
  string: 'oklch(53.2% 0.18 178)',
  builtIn: 'oklch(56.5% 0.22 48)',
  comment: 'oklch(66.4% 0.014 264)',
  name: 'oklch(57.5% 0.18 29)',
  section: 'oklch(55.2% 0.24 271)',
  bullet: 'oklch(55.5% 0.22 66)',
  addition: 'oklch(58.8% 0.22 176)',
  additionBackground: 'oklch(99.3% 0.01 160)',
  deletion: 'oklch(57.5% 0.18 29)',
  deletionBackground: 'oklch(99.7% 0.008 25)',
};

export const defaultDarkSyntaxValues: DesignSyntaxValues = {
  base: 'oklch(90% 0.002 264)',
  keyword: 'oklch(79.5% 0.17 295)',
  title: 'oklch(82.5% 0.16 245)',
  attr: 'oklch(77.2% 0.24 60)',
  string: 'oklch(81.5% 0.2 170)',
  builtIn: 'oklch(79.5% 0.22 45)',
  comment: 'oklch(77.5% 0.012 264)',
  name: 'oklch(80.3% 0.22 27.5)',
  section: 'oklch(79% 0.17 265)',
  bullet: 'oklch(67.5% 0.28 62)',
  addition: 'oklch(81.5% 0.2 170)',
  additionBackground: 'oklch(18% 0.04 170)',
  deletion: 'oklch(80.3% 0.22 27.5)',
  deletionBackground: 'oklch(18% 0.04 30)',
};

export const DERIVED_COLOR_TOKENS = {
  'text-disabled': 'color-mix(in oklch, var(--color-text-secondary) 45%, transparent)',
  'text-placeholder': 'color-mix(in oklch, var(--color-text-secondary) 55%, transparent)',
  'accent-subtle': 'color-mix(in oklch, var(--color-accent-default) 15%, transparent)',
  'danger-subtle': 'color-mix(in oklch, var(--color-danger-default) 12%, transparent)',
  'danger-border': 'color-mix(in oklch, var(--color-danger-default) 40%, transparent)',
  'success-subtle': 'color-mix(in oklch, var(--color-success-default) 12%, transparent)',
  'success-border': 'color-mix(in oklch, var(--color-success-default) 40%, transparent)',
  'warning-subtle': 'color-mix(in oklch, var(--color-warning-default) 12%, transparent)',
  'warning-border': 'color-mix(in oklch, var(--color-warning-default) 40%, transparent)',
  'info-subtle': 'color-mix(in oklch, var(--color-info-default) 12%, transparent)',
  'info-border': 'color-mix(in oklch, var(--color-info-default) 40%, transparent)',
  'overlay-backdrop': 'color-mix(in oklch, var(--color-overlay-default) 60%, transparent)',
} as const;
