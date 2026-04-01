import { useState } from 'react';
import { cn, darkShell, utilities as u } from './typewind';

export function App() {
  const [dark, setDark] = useState(false);

  const shell = cn(
    u.minHScreen,
    u.py8,
    u.px4,
    u.transitionColors,
    dark ? darkShell : undefined,
    dark ? u.bgSlate900 : u.bgSlate50,
  );

  const card = cn(
    u.wFull,
    u.maxW3xl,
    u.mxAuto,
    u.overflowHidden,
    u.roundedXl,
    u.border,
    u.shadowLg,
    u.transitionColors,
    dark ? u.borderSlate700 : u.borderSlate200,
    dark ? u.bgSlate800 : u.bgWhite,
  );

  const featureRow = cn(
    u.flex,
    u.itemsStart,
    u.gap4,
    u.p4,
    u.roundedLg,
    dark ? u.bgSlate900 : u.bgSlate100,
  );

  return (
    <div className={shell}>
      <header
        className={cn(u.flex, u.justifyBetween, u.itemsCenter, u.maxW3xl, u.mxAuto, u.mb4, u.wFull)}
      >
        <div>
          <h1
            className={cn(
              u.text3xl,
              u.fontBold,
              u.trackingTight,
              dark ? u.textWhite : u.textSlate900,
            )}
          >
            Typewind
          </h1>
          <p className={cn(u.textSm, u.mt4, dark ? u.textSlate500 : u.textSlate600)}>
            Tailwind-style utility classes, typed and emitted by typestyles (no Tailwind runtime).
          </p>
        </div>
        <button
          type="button"
          className={cn(
            u.cursorPointer,
            u.focusRing,
            u.roundedLg,
            u.px4,
            u.py2,
            u.textSm,
            u.fontSemibold,
            u.transitionColors,
            dark ? u.bgSlate700 : u.bgSlate100,
            dark ? u.textWhite : u.textSlate800,
          )}
          onClick={() => setDark((d) => !d)}
        >
          {dark ? 'Light' : 'Dark'} mode
        </button>
      </header>

      <article className={card}>
        <div className={cn(u.p8, u.border, dark ? u.borderSlate700 : u.borderSlate200)}>
          <p
            className={cn(
              u.textXs,
              u.fontSemibold,
              u.uppercase,
              u.trackingWide,
              u.textSlate500,
              u.mb2,
            )}
          >
            Example
          </p>
          <h2 className={cn(u.text2xl, u.fontBold, dark ? u.textWhite : u.textSlate900, u.mb2)}>
            Marketing card
          </h2>
          <p className={cn(u.textSlate600, u.textLg, u.mb4, dark ? u.textSlate400 : undefined)}>
            Each “class” is a{' '}
            <code className={cn(u.fontSemibold, dark ? u.textWhite : u.textSlate800)}>
              styles.class
            </code>{' '}
            registration with the same name Tailwind would use. Spacing and slate colors come from{' '}
            <code className={cn(u.fontSemibold, dark ? u.textWhite : u.textSlate800)}>
              tokens.create
            </code>{' '}
            so themes cascade.
          </p>
          <div className={cn(u.flex, u.flexCol, u.gap2, u.smFlexRow)}>
            <a
              href="https://github.com"
              className={cn(
                u.inlineFlex,
                u.itemsCenter,
                u.justifyCenter,
                u.roundedLg,
                u.px4,
                u.py3,
                u.textSm,
                u.fontSemibold,
                u.textWhite,
                u.transitionColors,
                u.bgBrand600,
                u.cursorPointer,
                u.focusRing,
                u.shadowMd,
              )}
            >
              Get started
            </a>
            <a
              href="#learn"
              className={cn(
                u.inlineFlex,
                u.itemsCenter,
                u.justifyCenter,
                u.roundedLg,
                u.border,
                u.px4,
                u.py3,
                u.textSm,
                u.fontSemibold,
                u.transitionColors,
                u.cursorPointer,
                u.focusRing,
                dark ? u.borderSlate600 : u.borderSlate200,
                dark ? u.textWhite : u.textSlate700,
              )}
            >
              Learn more
            </a>
          </div>
        </div>
        <ul
          className={cn(
            u.listNone,
            u.flex,
            u.flexCol,
            u.gap2,
            u.p6,
            dark ? u.bgSlate900 : u.bgSlate50,
          )}
        >
          <li className={featureRow}>
            <span
              className={cn(
                u.flex,
                u.h10,
                u.w10,
                u.shrink0,
                u.itemsCenter,
                u.justifyCenter,
                u.roundedLg,
                u.bgBrand500,
                u.textSm,
                u.fontBold,
                u.textWhite,
              )}
            >
              1
            </span>
            <div>
              <p className={cn(u.fontSemibold, dark ? u.textWhite : u.textSlate900)}>
                Atomic utilities
              </p>
              <p className={cn(u.textSm, u.textSlate600, dark ? u.textSlate400 : undefined)}>
                One TypeScript export per utility; compose with <code>cn()</code>.
              </p>
            </div>
          </li>
          <li className={featureRow}>
            <span
              className={cn(
                u.flex,
                u.h10,
                u.w10,
                u.shrink0,
                u.itemsCenter,
                u.justifyCenter,
                u.roundedLg,
                u.bgBrand500,
                u.textSm,
                u.fontBold,
                u.textWhite,
              )}
            >
              2
            </span>
            <div>
              <p className={cn(u.fontSemibold, dark ? u.textWhite : u.textSlate900)}>
                Design tokens
              </p>
              <p className={cn(u.textSm, u.textSlate600, dark ? u.textSlate400 : undefined)}>
                Same pattern as Tailwind theme keys, implemented as CSS variables.
              </p>
            </div>
          </li>
        </ul>
      </article>
    </div>
  );
}
