import { useState } from 'react';
import { createTypeStyles } from 'typestyles';
import { createStyled, TypeStylesProvider } from '@typestyles/react';

const { styles, tokens } = createTypeStyles({ scopeId: 'playground' });

const color = tokens.create('color', {
  primary: '#0066ff',
  surface: '#ffffff',
});

const styled = createStyled(styles);

const Button = styled('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: color.primary, color: color.surface },
      ghost: {
        backgroundColor: 'transparent',
        color: color.primary,
        border: `1px solid ${color.primary}`,
      },
    },
  },
  defaultVariants: { intent: 'primary' },
});

export default function App() {
  const [intent, setIntent] = useState<'primary' | 'ghost'>('primary');

  return (
    <TypeStylesProvider styles={styles}>
      <div style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button
          intent={intent}
          onClick={() => setIntent((value) => (value === 'primary' ? 'ghost' : 'primary'))}
        >
          Toggle intent
        </Button>
      </div>
    </TypeStylesProvider>
  );
}
