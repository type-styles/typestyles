import type { JSX } from 'react';
import { useLayoutEffect, useMemo, useState } from 'react';
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
import { designPaletteList } from '@examples/design-system';
import { site } from './site-styles';
import { appearanceBootstrap } from './appearanceBootstrap';
import {
  persistAppearance,
  readStoredMode,
  readStoredPalette,
  syncDocumentClass,
} from './appearanceRuntime';
import { usePrefersColorSchemeDark } from './usePrefersColorSchemeDark';

export function App(): JSX.Element {
  const [palette, setPalette] = useState(() => readStoredPalette(appearanceBootstrap));
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>(() => readStoredMode());
  const [agreed, setAgreed] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [plan, setPlan] = useState('starter');
  const [role, setRole] = useState('designer');
  const [tabId, setTabId] = useState('overview');

  const prefersDark = usePrefersColorSchemeDark();

  useLayoutEffect(() => {
    syncDocumentClass(appearanceBootstrap, palette, colorMode);
  }, [palette, colorMode]);

  const providerTheme =
    colorMode === 'dark'
      ? 'dark'
      : colorMode === 'light'
        ? 'light'
        : prefersDark
          ? 'dark'
          : 'light';

  const tabs = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        content: 'Composable, token-driven components for app shells.',
      },
      {
        id: 'tokens',
        label: 'Tokens',
        content: 'Token refs stay stable while themes swap values via CSS vars.',
      },
      {
        id: 'a11y',
        label: 'A11y',
        content: 'react-aria-components provide robust keyboard and screen-reader behavior.',
      },
    ],
    [],
  );

  function applyPalette(nextPalette: string): void {
    if (!appearanceBootstrap.map[nextPalette]) return;
    setPalette(nextPalette);
    persistAppearance(nextPalette, colorMode);
  }

  function toggleStoredLightDark(): void {
    const nextMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(nextMode);
    persistAppearance(palette, nextMode);
  }

  return (
    <DesignSystemProvider theme={providerTheme} omitWrapperThemeSurface>
      <main className={`${site.page} ${layout.stack}`}>
        <header className={`${site.header} ${layout.stack}`}>
          <h1 className={text.title}>Vite consuming shared typestyles design system</h1>
          <p className={text.subtitle}>
            Palette and color mode match the docs site: shared localStorage keys,{' '}
            <code>data-mode</code> on <code>html</code>, and the same Slate / Forest / Rose / Amber
            palettes.
          </p>
          <div className={site.appearanceControls}>
            <label className={site.themeFieldLabel} htmlFor="vite-palette-select">
              Palette
            </label>
            <select
              id="vite-palette-select"
              className={site.themeSelect}
              aria-label="Color palette"
              value={palette}
              onChange={(e) => applyPalette(e.target.value)}
            >
              {designPaletteList.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <span className={site.themeFieldLabel}>Color mode</span>
            <button
              type="button"
              className={site.themeToggle}
              aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleStoredLightDark}
            >
              {colorMode === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <section className={layout.section}>
          <h2 className={text.sectionTitle}>10 Common Components</h2>
          <div className={layout.row}>
            <Button intent="primary">Button</Button>
            <Link href="https://react-spectrum.adobe.com/react-aria/">Link</Link>
            <Dialog
              triggerLabel="Dialog"
              title="Design system modal"
              description="Modal behavior and focus management come from react-aria-components."
            />
          </div>
          <div className={layout.row}>
            <TextField
              label="Project name"
              placeholder="typestyles-ui"
              description="TextField + Input + Label + FieldError"
            />
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
          <TextAreaField
            label="Notes"
            placeholder="Describe your theming needs…"
            description="TextArea field for longer input."
          />
          <div className={layout.row}>
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
          <Tabs
            tabs={tabs}
            selectedKey={tabId}
            onSelectionChange={(key) => setTabId(String(key))}
          />
        </section>
      </main>
    </DesignSystemProvider>
  );
}
