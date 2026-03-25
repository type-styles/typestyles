import type { ComponentProps } from 'react';
import { Label, Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import { dsRadio } from '@examples/design-system';

export type RadioGroupOption = {
  value: string;
  label: string;
};

export type RadioGroupProps = Omit<ComponentProps<typeof AriaRadioGroup>, 'children'> & {
  label?: string;
  options: RadioGroupOption[];
};

export function RadioGroup({ label, options, ...props }: RadioGroupProps) {
  return (
    <AriaRadioGroup {...props} className={dsRadio('group')}>
      {label ? <Label className={dsRadio('groupLabel')}>{label}</Label> : null}
      {options.map((option) => (
        <AriaRadio key={option.value} value={option.value} className={dsRadio('item')}>
          {({ isSelected }) => (
            <>
              <span className={dsRadio('control')} data-selected={isSelected || undefined} />
              <span className={dsRadio('label')}>{option.label}</span>
            </>
          )}
        </AriaRadio>
      ))}
    </AriaRadioGroup>
  );
}
