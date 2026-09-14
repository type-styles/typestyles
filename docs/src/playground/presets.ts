import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PlaygroundPreset = {
  id: string;
  label: string;
  source: string;
};

/** Templates live under `docs/playground-templates` (cwd = docs package root).
 * Kept outside `src/` so Vite does not scan them as app modules (they are raw source for the REPL). */
function readTemplate(filename: string): string {
  return readFileSync(join(process.cwd(), 'playground-templates', filename), 'utf8').trim();
}

export const playgroundPresets: PlaygroundPreset[] = [
  { id: 'hello-button', label: 'Hello button', source: readTemplate('hello-button.tsx') },
  { id: 'css-prop', label: 'CSS prop', source: readTemplate('css-prop.tsx') },
  { id: 'theming', label: 'Light / dark', source: readTemplate('theming.tsx') },
];

export const defaultPresetId = 'hello-button';

export function getPresetSource(id: string): string {
  const preset = playgroundPresets.find((item) => item.id === id);
  return preset?.source ?? playgroundPresets[0]?.source ?? '';
}
