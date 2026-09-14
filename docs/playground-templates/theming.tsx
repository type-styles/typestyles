import { useState } from 'react';
import { createTypeStyles } from 'typestyles';
import { createStyled, TypeStylesProvider } from '@typestyles/react';

const { styles, tokens } = createTypeStyles({ scopeId: 'playground' });

const themeColor = tokens.create('theme', {
  text: '#111827',
  textMuted: '#6b7280',
  surface: '#ffffff',
  primary: '#0066ff',
});

const darkTheme = tokens.createTheme('dark', {
  base: {
    theme: {
      text: '#e0e0e0',
      textMuted: '#9ca3af',
      surface: '#1a1a2e',
      primary: '#66b3ff',
    },
  },
});

const styled = createStyled(styles);

const Panel = styled('div', {
  base: {
    padding: '1.5rem',
    borderRadius: '12px',
    backgroundColor: themeColor.surface,
    color: themeColor.text,
    border: `1px solid color-mix(in srgb, ${themeColor.primary} 30%, transparent)`,
    maxWidth: '22rem',
  },
});

const Toggle = styled('button', {
  base: {
    marginTop: '1rem',
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: themeColor.primary,
    color: themeColor.surface,
    fontWeight: 500,
  },
});

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <TypeStylesProvider styles={styles}>
      <div
        style={{
          padding: '2rem',
          minHeight: '100vh',
          background: dark ? '#030712' : '#f3f4f6',
        }}
      >
        <div className={dark ? darkTheme.className : undefined}>
          <Panel>
            <strong>Theming</strong>
            <p style={{ margin: '0.5rem 0 0', lineHeight: 1.5, color: themeColor.textMuted }}>
              Toggle a <code>createTheme</code> surface to swap token overrides.
            </p>
            <Toggle type="button" onClick={() => setDark((value) => !value)}>
              Switch to {dark ? 'light' : 'dark'}
            </Toggle>
          </Panel>
        </div>
      </div>
    </TypeStylesProvider>
  );
}
