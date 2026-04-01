'use client';

import type { JSX, ReactNode } from 'react';
import { getRegisteredCss } from 'typestyles/server';
import { useEffect, useState } from 'react';

export function TypestylesProvider({ children }: { children?: ReactNode }): JSX.Element {
  const [css, setCss] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCss(getRegisteredCss());
  }, []);

  return (
    <>
      {children}
      {mounted && css && <style id="typestyles" dangerouslySetInnerHTML={{ __html: css }} />}
    </>
  );
}
