import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { createStyles } from './styles';
import { getComponentMeta } from './component-meta';
import { registeredNamespaces } from './registry';

describe('styles.override() + __tsMeta', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  describe('getComponentMeta', () => {
    it('attaches non-enumerable dimensioned meta for semantic mode', () => {
      const styles = createStyles();
      const button = styles.component('ov-meta-btn', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' }, ghost: { color: 'transparent' } },
          size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
        },
      });

      const meta = getComponentMeta(button);
      expect(meta).toMatchObject({
        namespace: 'ov-meta-btn',
        kind: 'dimensioned',
        namingMode: 'semantic',
        base: 'ov-meta-btn',
      });
      expect(meta?.kind === 'dimensioned' && meta.variants.intent.primary).toBe(
        'ov-meta-btn--intent-primary',
      );
      expect(Object.keys(button)).not.toContain('__tsMeta');
    });

    it('records attribute selector fragments', () => {
      const styles = createStyles({ mode: 'attribute' });
      const button = styles.component('ov-attr-btn', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' } },
          disabled: { true: { opacity: 0.5 }, false: { opacity: 1 } },
        },
      });

      const meta = getComponentMeta(button);
      expect(meta?.kind).toBe('dimensioned');
      expect(meta?.namingMode).toBe('attribute');
      if (meta?.kind === 'dimensioned') {
        expect(meta.base).toBe('ov-attr-btn');
        expect(meta.variants.intent.primary).toBe('[data-intent="primary"]');
        expect(meta.variants.disabled.true).toBe('[data-disabled]');
        expect(meta.variants.disabled.false).toBe(':not([data-disabled])');
      }
    });

    it('attaches flat and slot meta', () => {
      const styles = createStyles();
      const card = styles.component('ov-flat-card', {
        base: { padding: '8px' },
        elevated: { boxShadow: '0 2px 4px black' },
      });
      const alert = styles.component('ov-slot-alert', {
        slots: ['root', 'icon'] as const,
        base: { root: { display: 'flex' }, icon: { width: '16px' } },
        variants: {
          tone: {
            danger: { root: { color: 'red' }, icon: { scale: '1.2' } },
          },
        },
      });

      expect(getComponentMeta(card)).toMatchObject({
        kind: 'flat',
        base: 'ov-flat-card',
        variants: { elevated: 'ov-flat-card--elevated' },
      });
      const slotMeta = getComponentMeta(alert);
      expect(slotMeta?.kind).toBe('slot');
      if (slotMeta?.kind === 'slot') {
        expect(slotMeta.base.root).toBe('ov-slot-alert');
        expect(slotMeta.base.icon).toBe('ov-slot-alert__icon');
        expect(slotMeta.variants.icon.tone.danger).toBe('ov-slot-alert__icon--tone-danger');
      }
    });
  });

  describe('emission', () => {
    it('emits base, variant, and compound overrides for semantic mode', () => {
      const styles = createStyles();
      const button = styles.component('ov-sem-btn', {
        base: { borderRadius: '6px' },
        variants: {
          intent: {
            primary: { backgroundColor: 'blue' },
            ghost: { backgroundColor: 'transparent' },
          },
          size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
        },
      });

      styles.override(button, {
        base: { borderRadius: '999px' },
        variants: {
          intent: { primary: { textTransform: 'uppercase' } },
        },
        compoundVariants: [
          {
            variants: { intent: 'primary', size: 'lg' },
            style: { letterSpacing: '0.05em' },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-sem-btn {');
      expect(css).toContain('border-radius: 999px');
      expect(css).toContain('.ov-sem-btn--intent-primary {');
      expect(css).toContain('text-transform: uppercase');
      expect(css).toContain('.ov-sem-btn--intent-primary.ov-sem-btn--size-lg {');
      expect(css).toContain('letter-spacing: 0.05em');
    });

    it('emits attribute-mode variant and compound selectors', () => {
      const styles = createStyles({ mode: 'attribute' });
      const button = styles.component('ov-attr-emit', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
          size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
        },
      });

      styles.override(button, {
        variants: {
          intent: { primary: { textTransform: 'uppercase' } },
        },
        compoundVariants: [
          {
            variants: { intent: 'primary', size: 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-attr-emit[data-intent="primary"] {');
      expect(css).toContain('text-transform: uppercase');
      expect(css).toContain('.ov-attr-emit[data-intent="primary"][data-size="lg"] {');
      expect(css).toContain('font-weight: 700');
    });

    it('emits :is() for compound array selections (semantic + attribute)', () => {
      const semantic = createStyles();
      const btn = semantic.component('ov-is-sem', {
        base: { display: 'flex' },
        variants: {
          intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
          size: { lg: { fontSize: '16px' } },
        },
      });
      semantic.override(btn, {
        compoundVariants: [
          {
            variants: { intent: ['primary', 'ghost'], size: 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();
      expect(getRegisteredCss()).toContain(
        ':is(.ov-is-sem--intent-primary, .ov-is-sem--intent-ghost).ov-is-sem--size-lg',
      );

      reset();
      registeredNamespaces.clear();

      const attribute = createStyles({ mode: 'attribute' });
      const abtn = attribute.component('ov-is-attr', {
        base: { display: 'flex' },
        variants: {
          intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
          size: { lg: { fontSize: '16px' } },
        },
      });
      attribute.override(abtn, {
        compoundVariants: [
          {
            variants: { intent: ['primary', 'ghost'], size: 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();
      expect(getRegisteredCss()).toContain(
        '.ov-is-attr:is([data-intent="primary"], [data-intent="ghost"])[data-size="lg"]',
      );
    });

    it('applies selectorPrefix as a descendant combinator', () => {
      const styles = createStyles();
      const button = styles.component('ov-prefix-btn', {
        base: { color: 'black' },
        variants: { intent: { primary: { color: 'blue' } } },
      });
      styles.override(
        button,
        { base: { boxShadow: 'none' }, variants: { intent: { primary: { color: 'red' } } } },
        { selectorPrefix: '.theme-acme' },
      );
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.theme-acme .ov-prefix-btn {');
      expect(css).toContain('.theme-acme .ov-prefix-btn--intent-primary {');
    });

    it('wraps rules in cascade layer when layer is set', () => {
      const styles = createStyles({
        layers: ['components', 'overrides'] as const,
      });
      const button = styles.component(
        'ov-layer-btn',
        { base: { color: 'black' } },
        { layer: 'components' },
      );
      styles.override(button, { base: { color: 'red' } }, { layer: 'overrides' });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('@layer components, overrides;');
      expect(css).toMatch(/@layer overrides \{[\s\S]*\.ov-layer-btn \{/);
      expect(css).toContain('color: red');
    });

    it('overrides slot recipes per slot', () => {
      const styles = createStyles();
      const alert = styles.component('ov-slot-emit', {
        slots: ['root', 'icon'] as const,
        base: { root: { display: 'flex' }, icon: { width: '16px' } },
        variants: {
          tone: {
            danger: { root: { color: 'red' }, icon: { opacity: 1 } },
          },
        },
      });

      styles.override(alert, {
        base: { root: { borderStyle: 'dashed' } },
        variants: { tone: { danger: { icon: { scale: '1.2' } } } },
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-slot-emit {');
      expect(css).toContain('border-style: dashed');
      expect(css).toContain('.ov-slot-emit__icon--tone-danger {');
      expect(css).toContain('scale: 1.2');
    });

    it('emits attribute-mode slot base, variant, and compound with selectorPrefix + layer', () => {
      const styles = createStyles({
        mode: 'attribute',
        layers: ['components', 'overrides', 'utilities'] as const,
      });
      const alert = styles.component(
        'ov-attr-slot',
        {
          slots: ['root', 'icon'] as const,
          base: { root: { display: 'flex' }, icon: { width: '16px' } },
          variants: {
            tone: {
              danger: { root: { color: 'red' }, icon: { opacity: 1 } },
              info: { root: { color: 'blue' }, icon: { opacity: 1 } },
            },
            size: {
              lg: { root: { gap: '12px' }, icon: { width: '24px' } },
            },
          },
        },
        { layer: 'components' },
      );

      const meta = getComponentMeta(alert);
      expect(meta).toMatchObject({
        kind: 'slot',
        namingMode: 'attribute',
        base: { root: 'ov-attr-slot', icon: 'ov-attr-slot__icon' },
      });
      if (meta?.kind === 'slot') {
        expect(meta.variants.icon.tone.danger).toBe('[data-tone="danger"]');
      }

      styles.override(
        alert,
        {
          base: { root: { borderStyle: 'dashed' } },
          variants: { tone: { danger: { icon: { scale: '1.2' } } } },
          compoundVariants: [
            {
              variants: { tone: 'danger', size: 'lg' },
              style: { root: { outline: '2px solid red' } },
            },
            {
              variants: { tone: ['danger', 'info'], size: 'lg' },
              style: { icon: { opacity: 0.8 } },
            },
          ],
        },
        { selectorPrefix: '.theme-acme', layer: 'overrides' },
      );
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('@layer components, overrides, utilities;');
      expect(css).toMatch(
        /@layer overrides \{[\s\S]*\.theme-acme \.ov-attr-slot \{[\s\S]*border-style: dashed/,
      );
      expect(css).toContain('.theme-acme .ov-attr-slot__icon[data-tone="danger"]');
      expect(css).toContain('scale: 1.2');
      expect(css).toContain('.theme-acme .ov-attr-slot[data-tone="danger"][data-size="lg"]');
      expect(css).toContain('outline: 2px solid red');
      expect(css).toContain(
        '.theme-acme .ov-attr-slot__icon:is([data-tone="danger"], [data-tone="info"])[data-size="lg"]',
      );
    });

    it('overrides flat variants', () => {
      const styles = createStyles();
      const card = styles.component('ov-flat-emit', {
        base: { padding: '8px' },
        elevated: { boxShadow: '0 1px 2px black' },
      });
      styles.override(card, {
        base: { padding: '16px' },
        elevated: { boxShadow: 'none' },
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-flat-emit {');
      expect(css).toContain('padding: 16px');
      expect(css).toContain('.ov-flat-emit--elevated {');
      expect(css).toContain('box-shadow: none');
    });

    it('emits bem-mode variant and compound selectors', () => {
      const styles = createStyles({ mode: 'bem' });
      const button = styles.component('ov-bem-btn', {
        base: { borderRadius: '6px' },
        variants: {
          intent: {
            primary: { backgroundColor: 'blue' },
            ghost: { backgroundColor: 'transparent' },
          },
          size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
        },
      });

      styles.override(button, {
        base: { borderRadius: '999px' },
        variants: { intent: { primary: { textTransform: 'uppercase' } } },
        compoundVariants: [
          {
            variants: { intent: 'primary', size: 'lg' },
            style: { letterSpacing: '0.05em' },
          },
          {
            variants: { intent: ['primary', 'ghost'], size: 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-bem-btn {');
      expect(css).toContain('border-radius: 999px');
      expect(css).toContain('.ov-bem-btn--primary {');
      expect(css).toContain('text-transform: uppercase');
      expect(css).toContain('.ov-bem-btn--primary.ov-bem-btn--lg {');
      expect(css).toContain('letter-spacing: 0.05em');
      expect(css).toContain(':is(.ov-bem-btn--primary, .ov-bem-btn--ghost).ov-bem-btn--lg');
      expect(css).toContain('font-weight: 700');
    });

    it('emits template-mode dimensioned, flat, and slot overrides', () => {
      const styles = createStyles({
        mode: 'template',
        classNameTemplate: ({ scope, namespace, element, modifier }) => {
          const base = element ? `${scope}${namespace}__${element}` : `${scope}${namespace}`;
          return modifier ? `${base}--${modifier}` : base;
        },
      });

      const button = styles.component('ov-tpl-btn', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' } },
          size: { lg: { fontSize: '16px' } },
        },
      });
      styles.override(button, {
        variants: { intent: { primary: { textTransform: 'uppercase' } } },
        compoundVariants: [
          {
            variants: { intent: 'primary', size: 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();
      let css = getRegisteredCss();
      expect(css).toContain('.ov-tpl-btn--primary {');
      expect(css).toContain('text-transform: uppercase');
      expect(css).toContain('.ov-tpl-btn--primary.ov-tpl-btn--lg {');
      expect(css).toContain('font-weight: 700');

      reset();
      registeredNamespaces.clear();

      const card = styles.component('ov-tpl-flat', {
        base: { padding: '8px' },
        elevated: { boxShadow: '0 1px 2px black' },
      });
      styles.override(card, {
        base: { padding: '16px' },
        elevated: { boxShadow: 'none' },
      });
      flushSync();
      css = getRegisteredCss();
      // Flat recipes under template mode follow semantic class naming.
      expect(css).toContain('.ov-tpl-flat-base {');
      expect(css).toContain('padding: 16px');
      expect(css).toContain('.ov-tpl-flat-elevated {');
      expect(css).toContain('box-shadow: none');

      reset();
      registeredNamespaces.clear();

      const alert = styles.component('ov-tpl-slot', {
        slots: ['root', 'icon'] as const,
        base: { root: { display: 'flex' }, icon: { width: '16px' } },
        variants: {
          tone: {
            danger: { root: { color: 'red' }, icon: { opacity: 1 } },
          },
        },
      });
      styles.override(alert, {
        base: { root: { gap: '8px' } },
        variants: { tone: { danger: { icon: { scale: '1.2' } } } },
        compoundVariants: [
          {
            variants: { tone: 'danger' },
            style: { root: { outline: '1px solid red' } },
          },
        ],
      });
      flushSync();
      css = getRegisteredCss();
      expect(css).toContain('.ov-tpl-slot {');
      expect(css).toContain('gap: 8px');
      expect(css).toContain('.ov-tpl-slot__icon--danger {');
      expect(css).toContain('scale: 1.2');
      expect(css).toContain('.ov-tpl-slot--danger {');
      expect(css).toContain('outline: 1px solid red');
    });

    it('expands utils on slot override leaves (not slot names as CSS keys)', () => {
      const styles = createStyles({
        utils: {
          marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
        },
      });
      const alert = styles.component('ov-util-slot', {
        slots: ['root', 'icon'] as const,
        base: { root: { display: 'flex' }, icon: { width: '16px' } },
        variants: {
          tone: {
            danger: { root: { color: 'red' }, icon: { opacity: 1 } },
          },
        },
      });

      styles.override(alert, {
        base: { root: { marginX: 12 }, icon: { gap: '4px' } },
        variants: { tone: { danger: { icon: { marginX: 4 } } } },
        compoundVariants: [
          {
            variants: { tone: 'danger' },
            style: { root: { marginX: 8 } },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).not.toContain('root:');
      expect(css).not.toContain('icon:');
      expect(css).toContain('.ov-util-slot {');
      expect(css).toContain('margin-left: 12px');
      expect(css).toContain('margin-right: 12px');
      expect(css).toContain('.ov-util-slot__icon {');
      expect(css).toContain('gap: 4px');
      expect(css).toContain('.ov-util-slot__icon--tone-danger {');
      expect(css).toContain('margin-left: 4px');
      expect(css).toContain('.ov-util-slot--tone-danger {');
      expect(css).toContain('margin-left: 8px');
    });

    it('overrides multi-slot recipes per slot', () => {
      const styles = createStyles();
      const card = styles.component('ov-multi-emit', {
        slots: ['root', 'title', 'body'] as const,
        root: { display: 'grid' },
        title: { fontWeight: 600 },
        body: { color: 'gray' },
      });

      expect(getComponentMeta(card)?.kind).toBe('multi-slot');

      styles.override(card, {
        base: {
          root: { gap: '12px' },
          title: { fontSize: '18px' },
        },
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-multi-emit {');
      expect(css).toContain('gap: 12px');
      expect(css).toContain('.ov-multi-emit__title {');
      expect(css).toContain('font-size: 18px');
    });

    it('emits boolean attribute compounds and nested selectors', () => {
      const styles = createStyles({ mode: 'attribute' });
      const button = styles.component('ov-bool-attr', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' } },
          disabled: { true: { opacity: 0.5 }, false: { opacity: 1 } },
        },
      });

      styles.override(button, {
        base: { '&:hover': { textDecoration: 'underline' } },
        variants: { disabled: { true: { cursor: 'not-allowed' } } },
        compoundVariants: [
          {
            variants: { intent: 'primary', disabled: true },
            style: { outline: 'none' },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-bool-attr:hover {');
      expect(css).toContain('text-decoration: underline');
      expect(css).toContain('.ov-bool-attr[data-disabled] {');
      expect(css).toContain('cursor: not-allowed');
      expect(css).toContain('.ov-bool-attr[data-intent="primary"][data-disabled] {');
      expect(css).toContain('outline: none');
    });

    it('emits semantic boolean compounds and nested &:hover', () => {
      const styles = createStyles();
      const button = styles.component('ov-bool-sem', {
        base: { display: 'inline-flex' },
        variants: {
          intent: { primary: { color: 'blue' } },
          disabled: { true: { opacity: 0.5 }, false: { opacity: 1 } },
        },
      });

      styles.override(button, {
        base: { '&:focus-visible': { outline: '2px solid blue' } },
        compoundVariants: [
          {
            variants: { intent: 'primary', disabled: true },
            style: { pointerEvents: 'none' },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('.ov-bool-sem:focus-visible {');
      expect(css).toContain('outline: 2px solid blue');
      expect(css).toContain('.ov-bool-sem--intent-primary.ov-bool-sem--disabled-true {');
      expect(css).toContain('pointer-events: none');
    });
  });

  describe('dev warnings', () => {
    it('warns on missing meta, unknown keys, and unsupported mode', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const styles = createStyles();
      const button = styles.component('ov-warn-btn', {
        base: { color: 'black' },
        variants: { intent: { primary: { color: 'blue' } } },
      });

      styles.override(button, {
        // Intentional unknown dimension — runtime warn path (compile-time covered in override.type-tests.ts)
        variants: { nope: { primary: { color: 'red' } } } as never,
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown variant dimension "nope"'),
      );

      styles.override({} as typeof button, { base: { color: 'red' } });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('requires a styles.component() return'),
      );

      const hashed = createStyles({ mode: 'hashed' });
      const hashedBtn = hashed.component('ov-hashed-btn', { base: { color: 'black' } });
      hashed.override(hashedBtn, { base: { color: 'red' } });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('does not support naming mode "hashed"'),
      );

      warn.mockRestore();
    });

    it('skips compound overrides with unknown selections instead of emitting partial selectors', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const styles = createStyles();
      const button = styles.component('ov-compound-warn', {
        base: { display: 'flex' },
        variants: {
          intent: { primary: { color: 'blue' } },
          size: { lg: { fontSize: '16px' } },
        },
      });

      styles.override(button, {
        compoundVariants: [
          {
            // Intentional unknown option — runtime warn path (compile-time covered in override.type-tests.ts)
            variants: { intent: 'primary', size: 'xl' as 'lg' },
            style: { fontWeight: 700 },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).not.toContain('font-weight: 700');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown variant option "size.xl"'),
      );
      warn.mockRestore();
    });

    it('skips empty compound selections instead of emitting a bare attribute base selector', () => {
      const styles = createStyles({ mode: 'attribute' });
      const button = styles.component('ov-empty-compound', {
        base: { display: 'flex' },
        variants: { intent: { primary: { color: 'blue' } } },
      });

      styles.override(button, {
        compoundVariants: [
          {
            variants: {} as { intent: 'primary' },
            style: { outline: '2px solid red' },
          },
        ],
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).not.toContain('outline: 2px solid red');
      expect(css).not.toMatch(/\.ov-empty-compound \{[^}]*outline/);
    });

    it('defaults omitted layer to "overrides" when that layer exists', () => {
      const styles = createStyles({
        layers: ['components', 'overrides', 'utilities'] as const,
      });
      const button = styles.component(
        'ov-default-layer',
        { base: { color: 'black' } },
        { layer: 'components' },
      );
      styles.override(button, { base: { color: 'red' } });
      flushSync();

      const css = getRegisteredCss();
      expect(css).toMatch(/@layer overrides \{[\s\S]*\.ov-default-layer \{/);
      expect(css).toContain('color: red');
    });

    it('throws when layered without "overrides" and no explicit layer', () => {
      const styles = createStyles({
        layers: ['components', 'theme'] as const,
      });
      const button = styles.component(
        'ov-require-layer',
        { base: { color: 'black' } },
        { layer: 'components' },
      );
      expect(() => styles.override(button, { base: { color: 'red' } })).toThrow(
        /requires `\{ layer:/,
      );
    });

    it('warns and skips base override when meta.base is empty', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const styles = createStyles();
      // Flat recipes may omit `base`; meta.base is then "".
      const card = styles.component('ov-nobase-flat', {
        elevated: { boxShadow: '0 1px 2px black' },
      });
      expect(getComponentMeta(card)?.kind === 'flat' && getComponentMeta(card)?.base).toBe('');

      styles.override(card, {
        base: { color: 'red' },
        elevated: { boxShadow: 'none' },
      });
      flushSync();

      const css = getRegisteredCss();
      expect(css).not.toMatch(/(^|\n)\. \{/);
      expect(css).not.toContain('color: red');
      expect(css).toContain('.ov-nobase-flat--elevated {');
      expect(css).toContain('box-shadow: none');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('meta.base is empty'));
      warn.mockRestore();
    });

    it('throws when layer is set without createStyles({ layers })', () => {
      const styles = createStyles();
      const button = styles.component('ov-throw-btn', { base: { color: 'black' } });
      expect(() =>
        styles.override(button, { base: { color: 'red' } }, { layer: 'overrides' }),
      ).toThrow(/requires `createStyles\(\{ layers:/);
    });
  });

  describe('typing', () => {
    it('documents that compile-time checks live in override.type-tests.ts', () => {
      // Runtime smoke: valid calls still work. Negative cases are enforced by
      // `pnpm typecheck` via src/override.type-tests.ts (@ts-expect-error).
      const styles = createStyles();
      const button = styles.component('ov-types-btn', {
        base: { color: 'black' },
        variants: {
          intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
        },
      });

      styles.override(button, {
        base: { color: 'red' },
        variants: { intent: { primary: { textTransform: 'uppercase' } } },
        compoundVariants: [
          {
            variants: { intent: 'ghost' },
            style: { fontWeight: 700 },
          },
        ],
      });
      expect(button.base).toBe('ov-types-btn');
    });
  });
});
