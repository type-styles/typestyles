/**
 * `useServerInsertedHTML` exists at runtime in Next.js App Router / React 18.3+ client builds,
 * but some `@types/react` releases omit it. Augment `react` so local `tsc` and tooling match runtime.
 *
 * @see https://react.dev/reference/react-dom/server/useServerInsertedHTML
 */
import type { ReactNode } from 'react';

declare module 'react' {
  export function useServerInsertedHTML(callback: () => ReactNode | null): void;
}

export {};
