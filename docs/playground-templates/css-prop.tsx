/** @jsxImportSource @typestyles/react */
import { createTypeStyles } from 'typestyles';
import { TypeStylesProvider } from '@typestyles/react';

const { styles, tokens } = createTypeStyles({ scopeId: 'playground' });

const color = tokens.create('color', {
  accent: '#7c3aed',
  surface: '#faf5ff',
});

const card = styles.component('card', {
  base: {
    padding: '1.5rem',
    borderRadius: '12px',
    backgroundColor: color.surface,
    border: `1px solid color-mix(in oklch, ${color.accent} 25%, transparent)`,
    maxWidth: '20rem',
  },
});

export default function App() {
  return (
    <TypeStylesProvider styles={styles}>
      <div style={{ padding: '2rem' }}>
        <div
          className={card()}
          css={{ boxShadow: '0 8px 24px color-mix(in oklch, #7c3aed 18%, transparent)' }}
        >
          <h2 css={{ margin: '0 0 0.5rem', fontSize: '1.125rem', color: color.accent }}>
            CSS prop
          </h2>
          <p css={{ margin: 0, lineHeight: 1.5, color: '#4b5563' }}>
            Style elements with the <code>css</code> prop — objects become deterministic classes.
          </p>
        </div>
      </div>
    </TypeStylesProvider>
  );
}
