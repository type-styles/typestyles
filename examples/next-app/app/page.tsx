'use client';

import { useState } from 'react';
import { button } from '../styles/button';
import { card, cardHeader, cardTitle, cardDescription, cardContent } from '../styles/card';
import { pageStyles } from '../styles/page';

const EXAMPLES = ['Examples', 'Dashboard', 'Tasks', 'Playground', 'Authentication'] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('Examples');

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.container}>
        {/* Hero Section */}
        <section className={pageStyles.hero}>
          <h1 className={pageStyles.h1}>The Foundation for your Design System</h1>
          <p className={pageStyles.subtitle}>
            A set of beautifully designed components that you can customize, extend, and build on.
            Start here then make it your own. Open Source. Open Code.
          </p>
          <div className={pageStyles.heroButtons}>
            <button className={button('default', 'lg')}>New Project</button>
            <button className={button('outline', 'lg')}>View Components</button>
          </div>
        </section>

        {/* Components Section */}
        <section className={pageStyles.section('border')}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Components</h2>
            <p className={pageStyles.sectionDescription}>
              A collection of reusable components built with typestyles.
            </p>
          </div>

          <div className={pageStyles.tabs}>
            {EXAMPLES.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={pageStyles.tab(activeTab === tab ? 'active' : false)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={pageStyles.toolbar}>
            <select className={pageStyles.select} defaultValue="neutral">
              <option value="neutral">Neutral</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className={pageStyles.grid}>
            <div className={pageStyles.featureCard}>
              <div className={pageStyles.featureIcon()}>B</div>
              <h3 className={pageStyles.featureTitle}>Button</h3>
              <p className={pageStyles.featureDescription}>
                Displays a button or a component that looks like a button.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className={button('default')}>Default</button>
                <button className={button('secondary')}>Secondary</button>
                <button className={button('outline')}>Outline</button>
                <button className={button('ghost')}>Ghost</button>
              </div>
            </div>

            <div className={pageStyles.featureCard}>
              <div className={pageStyles.featureIcon()}>C</div>
              <h3 className={pageStyles.featureTitle}>Card</h3>
              <p className={pageStyles.featureDescription}>
                Contains content and actions about a single subject.
              </p>
              <div className={card}>
                <div className={cardHeader}>
                  <h4 className={cardTitle}>Card Title</h4>
                  <p className={cardDescription}>Card description goes here</p>
                </div>
                <div className={cardContent} />
              </div>
            </div>

            <div className={pageStyles.featureCard}>
              <div className={pageStyles.featureIcon('accent')}>T</div>
              <h3 className={pageStyles.featureTitle}>Theming</h3>
              <p className={pageStyles.featureDescription}>
                Support for light and dark mode with CSS variables.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className={button('outline', 'sm')}>Light</button>
                <button className={button('default', 'sm')}>Dark</button>
              </div>
            </div>

            <div className={pageStyles.featureCard}>
              <div className={pageStyles.featureIcon('success')}>✓</div>
              <h3 className={pageStyles.featureTitle}>Accessible</h3>
              <p className={pageStyles.featureDescription}>
                Built with accessibility in mind. Follows WAI-ARIA patterns.
              </p>
            </div>
          </div>
        </section>

        {/* Code Section */}
        <section className={pageStyles.section('border')}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>Easy to use</h2>
            <p className={pageStyles.sectionDescription}>
              Define styles with a simple, type-safe API.
            </p>
          </div>

          <div className={pageStyles.codeBlock}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`import { styles } from 'typestyles';

// Single class — no variants needed
const card = styles.class('card', {
  padding: '1rem',
  borderRadius: '0.5rem',
  backgroundColor: 'white',
});
<div className={card} />

// With variants — base + variants, no 'base' key
const button = styles.create('button',
  { padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '500' },
  {
    default: { backgroundColor: 'hsl(222.2 47.4% 11.2%)', color: 'white' },
    outline: { border: '1px solid', backgroundColor: 'transparent' },
  }
);
<button className={button('default')} />  // base always included`}</pre>
          </div>
        </section>

        <footer className={pageStyles.footer}>
          <p>Built with typestyles. Open source. MIT License.</p>
        </footer>
      </div>
    </div>
  );
}
