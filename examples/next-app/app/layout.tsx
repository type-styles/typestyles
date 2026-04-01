import type { JSX } from 'react';
import type { ReactNode } from 'react';
import './globals.css';
import './typestyles.css';

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  );
}
