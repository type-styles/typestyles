import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe } from 'vitest';
import { noRemovedPublicClassname, resetSnapshotCache } from './no-removed-public-classname';
import { ruleTester } from '../test/rule-tester';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const snapshot = path.join(fixturesDir, 'public-classnames.json');
const invalidSnapshot = path.join(fixturesDir, 'public-classnames.invalid.json');
const missingSnapshot = path.join(fixturesDir, 'does-not-exist.json');

const options = [{ snapshot }] as const;

describe('no-removed-public-classname', () => {
  beforeEach(() => {
    resetSnapshotCache();
  });

  ruleTester.run('no-removed-public-classname', noRemovedPublicClassname, {
    valid: [
      // Every snapshotted class name is still emitted.
      {
        code: `
          styles.component('button', {
            base: { padding: 8 },
            variants: {
              intent: {
                primary: { color: 'blue' },
                secondary: { color: 'gray' },
              },
            },
          });
        `,
        filename: 'src/components/button.ts',
        options,
      },
      // Adding a new variant key never fails — only removals/renames do.
      {
        code: `
          styles.component('button', {
            base: { padding: 8 },
            variants: {
              intent: {
                primary: { color: 'blue' },
                secondary: { color: 'gray' },
                danger: { color: 'red' },
              },
              size: {
                sm: { fontSize: 14 },
              },
            },
          });
        `,
        filename: 'src/components/button.ts',
        options,
      },
      // styles.class name unchanged.
      {
        code: `styles.class('card', { padding: 16 })`,
        filename: 'src/components/card.ts',
        options,
      },
      // Flat variant config: all snapshotted keys still present (plus a new one).
      {
        code: `
          styles.component('badge', {
            base: { display: 'inline-flex' },
            elevated: { boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)' },
            compact: { padding: 2 },
          });
        `,
        filename: 'src/components/badge.ts',
        options,
      },
      // Slot component: slot base classes and slot variant classes still emitted.
      {
        code: `
          styles.component('menu', {
            slots: ['root', 'item'],
            base: {
              root: { display: 'grid' },
              item: { padding: 4 },
            },
            variants: {
              tone: {
                danger: { item: { color: 'red' } },
              },
            },
          });
        `,
        filename: 'src/components/menu.ts',
        options,
      },
      // File not listed in the snapshot — nothing to defend.
      {
        code: `styles.class('tooltip', { position: 'absolute' })`,
        filename: 'src/components/tooltip.ts',
        options,
      },
      // Opt-in: no snapshot file → rule is a no-op.
      {
        code: `styles.class('renamed-card', { padding: 16 })`,
        filename: 'src/components/card.ts',
        options: [{ snapshot: missingSnapshot }],
      },
      // Unanalyzable config (spread) — conservatively skipped, no false positives.
      {
        code: `
          styles.component('button', {
            base: { padding: 8 },
            variants: { ...dynamicVariants },
          });
        `,
        filename: 'src/components/button.ts',
        options,
      },
      // Dynamic namespace — conservatively skips the whole file.
      {
        code: `styles.component(namespaceFromSomewhere, { base: { padding: 8 } })`,
        filename: 'src/components/button.ts',
        options,
      },
    ],
    invalid: [
      // Renaming the namespace drops every shipped `button-*` class name.
      {
        code: `
          styles.component('btn', {
            base: { padding: 8 },
            variants: {
              intent: {
                primary: { color: 'blue' },
                secondary: { color: 'gray' },
              },
            },
          });
        `,
        filename: 'src/components/button.ts',
        options,
        errors: [
          { messageId: 'removedClassName', data: { className: 'button-base', snapshot } },
          { messageId: 'removedClassName', data: { className: 'button-intent-primary', snapshot } },
          {
            messageId: 'removedClassName',
            data: { className: 'button-intent-secondary', snapshot },
          },
        ],
      },
      // Removing a variant key drops one shipped class name.
      {
        code: `
          styles.component('button', {
            base: { padding: 8 },
            variants: {
              intent: {
                primary: { color: 'blue' },
              },
            },
          });
        `,
        filename: 'src/components/button.ts',
        options,
        errors: [
          {
            messageId: 'removedClassName',
            data: { className: 'button-intent-secondary', snapshot },
          },
        ],
      },
      // Renaming a variant *dimension* renames every class under it.
      {
        code: `
          styles.component('button', {
            base: { padding: 8 },
            variants: {
              tone: {
                primary: { color: 'blue' },
                secondary: { color: 'gray' },
              },
            },
          });
        `,
        filename: 'src/components/button.ts',
        options,
        errors: [
          { messageId: 'removedClassName', data: { className: 'button-intent-primary', snapshot } },
          {
            messageId: 'removedClassName',
            data: { className: 'button-intent-secondary', snapshot },
          },
        ],
      },
      // Renaming a styles.class name.
      {
        code: `styles.class('panel', { padding: 16 })`,
        filename: 'src/components/card.ts',
        options,
        errors: [{ messageId: 'removedClassName', data: { className: 'card', snapshot } }],
      },
      // Removing a slot variant class (config becomes a plain multi-slot component).
      {
        code: `
          styles.component('menu', {
            slots: ['root', 'item'],
            root: { display: 'grid' },
            item: { padding: 4 },
          });
        `,
        filename: 'src/components/menu.ts',
        options,
        errors: [
          { messageId: 'removedClassName', data: { className: 'menu-item-tone-danger', snapshot } },
        ],
      },
      // Deleting the component entirely.
      {
        code: `export const nothingHere = true;`,
        filename: 'src/components/card.ts',
        options,
        errors: [{ messageId: 'removedClassName', data: { className: 'card', snapshot } }],
      },
      // Malformed snapshot reports instead of silently passing.
      {
        code: `styles.class('card', { padding: 16 })`,
        filename: 'src/components/card.ts',
        options: [{ snapshot: invalidSnapshot }],
        errors: [{ messageId: 'invalidSnapshot' }],
      },
    ],
  });
});
