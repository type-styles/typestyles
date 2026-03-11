'use client';

import React, { useState, useEffect, useServerInsertedHTML, useSyncExternalStore } from 'react';
import { getRegisteredCss } from 'typestyles/server';

/**
 * Subscribe to typestyles CSS changes. Use this in client components
 * that need to stay up-to-date with dynamically registered styles.
 */
export function useTypestyles(): ReturnType<typeof useSyncExternalStore<string>>;

/**
 * Collect styles during server rendering for App Router.
 */
export { useServerInsertedHTML };

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
