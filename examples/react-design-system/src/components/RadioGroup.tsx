import type { JSX } from 'react';
import {
  Label,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
} from 'react-aria-components';
import { radio } from '@examples/design-system';

export type RadioGroupOption = {
  value: string;
  label: string;
};

export type RadioGroupProps = Omit<RACRadioGroupProps, 'children'> & {
  label?: string;
  options: RadioGroupOption[];
};

export function RadioGroup({ label, options, ...props }: RadioGroupProps): JSX.Element {
  return (
    <AriaRadioGroup {...props} className={radio.group}>
      {label ? <Label className={radio.groupLabel}>{label}</Label> : null}
      {options.map((option) => (
        <AriaRadio key={option.value} value={option.value} className={radio.item}>
          {({ isSelected }) => (
            <>
              <span className={radio.control} data-selected={isSelected || undefined} />
              <span className={radio.label}>{option.label}</span>
            </>
          )}
        </AriaRadio>
      ))}
    </AriaRadioGroup>
  );
}
