'use client';

import { getRegisteredCss } from 'typestyles/server';
import { useEffect, useState } from 'react';

export function TypestylesProvider({ children }: { children?: React.ReactNode }) {
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
