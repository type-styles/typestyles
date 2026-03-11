import type { ReactNode } from 'react';
import { getRegisteredCss } from 'typestyles/server';
import { ThemeProvider } from '../components/ThemeProvider';
import { Navbar } from '../components/Navbar';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const css = getRegisteredCss();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>{css && <style dangerouslySetInnerHTML={{ __html: css }} />}</head>
      <body>
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
