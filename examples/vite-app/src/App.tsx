import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DesignSystemProvider,
  Dialog,
  layout,
  text,
  Link,
  RadioGroup,
  Select,
  Switch,
  Tabs,
  TextAreaField,
  TextField,
} from '@examples/react-design-system';
import { tokens } from 'typestyles';

const oceanThemeClass = tokens.createTheme('ds-ocean', {
  color: {
    accent: '#0284c7',
    accentHover: '#0369a1',
    accentForeground: '#f0f9ff',
    focusRing: '#38bdf8',
  },
});

type ThemeMode = 'light' | 'dark' | 'ocean';

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [agreed, setAgreed] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [plan, setPlan] = useState('starter');
  const [role, setRole] = useState('designer');
  const [tabId, setTabId] = useState('overview');

  const customThemeClassName = themeMode === 'ocean' ? oceanThemeClass : undefined;
  const providerTheme = themeMode === 'dark' ? 'dark' : 'light';

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', content: 'Composable, token-driven components for app shells.' },
      { id: 'tokens', label: 'Tokens', content: 'Token refs stay stable while themes swap values via CSS vars.' },
      { id: 'a11y', label: 'A11y', content: 'react-aria-components provide robust keyboard and screen-reader behavior.' },
    ],
    [],
  );

  return (
    <DesignSystemProvider theme={providerTheme} customThemeClassName={customThemeClassName}>
      <main className={layout('stack')} style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px' }}>
        <header className={layout('stack')} style={{ gap: 10 }}>
          <h1 className={text('title')}>Vite consuming shared typestyles design system</h1>
          <p className={text('subtitle')}>
            This page uses one shared React library and switches between default, dark, and custom themes.
          </p>
          <div className={layout('row')}>
            <Button intent={themeMode === 'light' ? 'primary' : 'secondary'} onPress={() => setThemeMode('light')}>
              Light
            </Button>
            <Button intent={themeMode === 'dark' ? 'primary' : 'secondary'} onPress={() => setThemeMode('dark')}>
              Dark
            </Button>
            <Button intent={themeMode === 'ocean' ? 'primary' : 'secondary'} onPress={() => setThemeMode('ocean')}>
              Ocean (custom)
            </Button>
          </div>
        </header>

        <section className={layout('section')}>
          <h2 className={text('sectionTitle')}>10 Common Components</h2>
          <div className={layout('row')}>
            <Button intent="primary">Button</Button>
            <Link href="https://react-spectrum.adobe.com/react-aria/">Link</Link>
            <Dialog
              triggerLabel="Dialog"
              title="Design system modal"
              description="Modal behavior and focus management come from react-aria-components."
            />
          </div>
          <div className={layout('row')}>
            <TextField label="Project name" placeholder="typestyles-ui" description="TextField + Input + Label + FieldError" />
            <Select
              label="Plan"
              selectedKey={plan}
              onSelectionChange={(key) => setPlan(String(key))}
              options={[
                { id: 'starter', label: 'Starter' },
                { id: 'team', label: 'Team' },
                { id: 'enterprise', label: 'Enterprise' },
              ]}
            />
          </div>
          <TextAreaField label="Notes" placeholder="Describe your theming needs…" description="TextArea field for longer input." />
          <div className={layout('row')}>
            <Checkbox isSelected={agreed} onChange={setAgreed}>
              Checkbox
            </Checkbox>
            <Switch isSelected={notifications} onChange={setNotifications}>
              Switch
            </Switch>
          </div>
          <RadioGroup
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { value: 'designer', label: 'Designer' },
              { value: 'developer', label: 'Developer' },
              { value: 'pm', label: 'Product Manager' },
            ]}
          />
          <Tabs tabs={tabs} selectedKey={tabId} onSelectionChange={(key) => setTabId(String(key))} />
        </section>
      </main>
    </DesignSystemProvider>
  );
}
