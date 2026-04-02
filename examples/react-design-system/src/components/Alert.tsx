import type { JSX, ReactNode } from 'react';
import { alert } from '@examples/design-system';
import { cx } from './utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'tip';
export type AlertAppearance = 'subtle' | 'solid';

export type AlertProps = {
  variant: AlertVariant;
  appearance?: AlertAppearance;
  title?: string;
  action?: { href: string; label: string };
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const subtleTone: Record<AlertVariant, string> = {
  info: alert.subtleInfo,
  success: alert.subtleSuccess,
  warning: alert.subtleWarning,
  danger: alert.subtleDanger,
  tip: alert.subtleTip,
};

const solidTone: Record<AlertVariant, string> = {
  info: alert.solidInfo,
  success: alert.solidSuccess,
  warning: alert.solidWarning,
  danger: alert.solidDanger,
  tip: alert.solidTip,
};

const titleAccent: Record<AlertVariant, string> = {
  info: alert.titleAccentInfo,
  success: alert.titleAccentSuccess,
  warning: alert.titleAccentWarning,
  danger: alert.titleAccentDanger,
  tip: alert.titleAccentTip,
};

export function Alert({
  variant,
  appearance = 'subtle',
  title,
  action,
  icon,
  children,
  className,
}: AlertProps): JSX.Element {
  const toneClass = appearance === 'solid' ? solidTone[variant] : subtleTone[variant];
  const titleAccentClass = appearance === 'subtle' ? titleAccent[variant] : '';

  return (
    <div
      className={cx(alert.root, toneClass, className)}
      data-alert
      data-alert-variant={variant}
      data-alert-appearance={appearance}
    >
      {icon ? (
        <div className={alert.icon} data-alert-icon>
          {icon}
        </div>
      ) : null}
      <div className={alert.body}>
        {title ? <p className={cx(alert.title, titleAccentClass)}>{title}</p> : null}
        <div className={cx(alert.content, !title && alert.contentFlush)} data-alert-content>
          {children}
        </div>
        {action ? (
          <div className={alert.action}>
            <a className={alert.actionLink} href={action.href} data-alert-action>
              {action.label}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
