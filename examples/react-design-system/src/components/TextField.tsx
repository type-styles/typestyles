import type { JSX } from 'react';
import { FieldError, Input, Label, TextField as AriaTextField } from 'react-aria-components';
import { textField } from '@examples/design-system';
import type { BaseTextFieldProps } from './utils';

export type TextFieldProps = BaseTextFieldProps & {
  placeholder?: string;
};

export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps): JSX.Element {
  return (
    <AriaTextField {...props} className={textField('root')}>
      {label ? <Label className={textField('label')}>{label}</Label> : null}
      <Input className={textField('input')} placeholder={placeholder} />
      {description ? <p className={textField('description')}>{description}</p> : null}
      <FieldError className={textField('error')}>{errorMessage ?? ''}</FieldError>
    </AriaTextField>
  );
}
