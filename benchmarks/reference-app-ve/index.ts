import {
  beginFileScope,
  endScope,
  resetVe,
  getCollectedCss,
  serializeCollectedCss,
} from './harness';
import { createVeTokens } from './tokens';
import { createVeComponents } from './components';
import { createVeThemes } from './themes';

export function createVeReferenceApp() {
  resetVe();

  beginFileScope('tokens.css.ts');
  const tokens = createVeTokens();
  endScope();

  beginFileScope('components.css.ts');
  const components = createVeComponents(tokens);
  endScope();

  beginFileScope('themes.css.ts');
  const themes = createVeThemes(tokens);
  endScope();

  return { tokens, components, themes };
}

export function exerciseVeComponents(app: ReturnType<typeof createVeReferenceApp>) {
  const c = app.components;

  c.button();
  c.button({ intent: 'primary', size: 'lg' });
  c.button({ intent: 'secondary', size: 'sm' });
  c.button({ intent: 'ghost', size: 'md' });
  c.button({ intent: 'danger', size: 'lg' });
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
  c.select();
  c.select({ size: 'sm' });
  c.select({ size: 'lg' });
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
  c.toast();
  c.toast({ tone: 'success' });
  c.toast({ tone: 'danger' });
  c.toast({ tone: 'warning' });
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
}

export { getCollectedCss, serializeCollectedCss, resetVe } from './harness';
