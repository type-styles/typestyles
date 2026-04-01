import type * as React from 'react';
import type { useSyncExternalStore } from 'react';

/**
 * Subscribe to typestyles CSS changes. Use this in client components
 * that need to stay up-to-date with dynamically registered styles.
 */
export function useTypestyles(): ReturnType<typeof useSyncExternalStore<string>>;

/**
 * Re-export of React’s `useServerInsertedHTML` (App Router / streaming SSR).
 * Declared here so consumers get a stable signature even when their `@types/react` predates the hook.
 */
export function useServerInsertedHTML(callback: () => React.ReactNode | null): void;

/**
 * Props for the TypestylesStylesheet component.
 */
export interface TypestylesStylesheetProps {
  children?: React.ReactNode;
}

/**
 * A React component that renders typestyles CSS.
 */
export function TypestylesStylesheet(props: TypestylesStylesheetProps): React.JSX.Element | null;

/**
 * Create a Next.js layout export that includes typestyles.
 */
export function createTypestylesLayout<P extends { children?: React.ReactNode }>(
  layout: (props: P) => React.ReactNode,
): (props: P) => React.JSX.Element;
