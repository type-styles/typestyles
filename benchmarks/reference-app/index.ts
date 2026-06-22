import { createStyles, createTokens } from 'typestyles';
import type { ClassNamingMode } from 'typestyles';
import { createReferenceTokens } from './tokens';
import { createReferenceComponents } from './components';
import { createReferenceThemes } from './themes';
import { createReferenceGlobals } from './globals';
import { createReferenceKeyframes } from './keyframes';

export type ReferenceAppOptions = {
  mode?: ClassNamingMode;
  scopeId?: string;
};

export function createReferenceApp(opts: ReferenceAppOptions = {}) {
  const { mode = 'semantic', scopeId = 'bench' } = opts;

  const styles = createStyles({ mode, scopeId });
  const tokensApi = createTokens({ scopeId });

  const tokens = createReferenceTokens(tokensApi);
  const components = createReferenceComponents(styles, tokens);
  const themes = createReferenceThemes(tokensApi);
  const keyframeAnims = createReferenceKeyframes();

  return {
    styles,
    tokens: tokensApi,
    components,
    themes,
    keyframes: keyframeAnims,
    createGlobals: () => createReferenceGlobals(tokens),
  };
}

export function exerciseComponents(app: ReturnType<typeof createReferenceApp>) {
  const c = app.components;

  // Call every component function to trigger class name generation
  c.button();
  c.button({ intent: 'primary', size: 'lg' });
  c.button({ intent: 'secondary', size: 'sm' });
  c.button({ intent: 'ghost', size: 'md' });
  c.button({ intent: 'danger', size: 'lg' });
  c.card();
  c.card({ elevated: true, interactive: true });
  c.card({ compact: true });
  c.input();
  c.input({ size: 'sm', state: 'error' });
  c.input({ size: 'lg', state: 'success' });
  c.badge();
  c.badge({ tone: 'primary', size: 'md' });
  c.badge({ tone: 'danger' });
  c.badge({ tone: 'success' });
  c.badge({ tone: 'warning' });
  c.avatar();
  c.avatar({ size: 'xs' });
  c.avatar({ size: 'xl' });
  c.checkbox();
  c.checkbox({ disabled: true });
  c.radio();
  c.radio({ disabled: true });
  c.toggle();
  c.toggle({ disabled: true });
  c.select();
  c.select({ size: 'sm' });
  c.select({ size: 'lg' });
  c.textarea();
  c.textarea({ error: true });
  c.label();
  c.label({ required: true });
  c.alert();
  c.alert({ tone: 'success' });
  c.alert({ tone: 'warning' });
  c.alert({ tone: 'danger' });
  c.dialog();
  c.dialog({ size: 'sm' });
  c.dialog({ size: 'lg' });
  c.dialog({ size: 'fullscreen' });
  c.dropdown();
  c.dropdown({ align: 'end' });
  c.dropdown({ align: 'center' });
  c.tabs();
  c.tabs({ variant: 'pill' });
  c.tabTrigger();
  c.tabTrigger({ variant: 'pill' });
  c.paginationButton();
  c.paginationButton({ active: true });
  c.paginationButton({ disabled: true });
  c.sidebar();
  c.sidebar({ expanded: true });
  c.navItem();
  c.navItem({ active: true });
  c.text();
  c.text({ size: 'xl', weight: 'bold', tone: 'secondary' });
  c.text({ size: 'xs', tone: 'muted', align: 'center' });
  c.heading();
  c.heading({ level: 'h1' });
  c.heading({ level: 'h3' });
  c.heading({ level: 'h6' });
  c.link();
  c.link({ variant: 'subtle' });
  c.separator();
  c.separator({ orientation: 'vertical' });
  c.skeleton();
  c.skeleton({ variant: 'circle' });
  c.skeleton({ variant: 'rect' });
  c.progress();
  c.progress({ tone: 'success', size: 'lg' });
  c.progress({ tone: 'danger', size: 'sm' });
  c.tag();
  c.tag({ removable: true });
  c.toast();
  c.toast({ tone: 'success' });
  c.toast({ tone: 'danger' });
  c.toast({ tone: 'warning' });
  c.accordionItem();
  c.accordionItem({ open: true });
  c.container();
  c.container({ size: 'sm' });
  c.container({ size: 'xl' });
  c.grid();
  c.grid({ cols: '2' });
  c.grid({ cols: '3' });
  c.grid({ cols: '4' });
  c.stack();
  c.stack({ gap: 'xs', align: 'center' });
  c.stack({ gap: 'xl', align: 'start' });
  c.inline();
  c.inline({ gap: 'sm', justify: 'between', wrap: 'wrap' });
  c.formField();
  c.formField({ error: true });
  c.helperText();
  c.helperText({ error: true });
}

export { createReferenceTokens } from './tokens';
export { createReferenceComponents } from './components';
export { createReferenceThemes } from './themes';
export { createReferenceGlobals } from './globals';
export { createReferenceKeyframes } from './keyframes';
