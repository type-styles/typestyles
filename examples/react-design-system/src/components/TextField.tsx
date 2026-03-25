import { FieldError, Input, Label, TextField as AriaTextField } from 'react-aria-components';
import { dsTextField } from '@examples/design-system';
import type { BaseTextFieldProps } from './utils';

export type TextFieldProps = BaseTextFieldProps & {
  placeholder?: string;
};

export function TextField({ label, description, errorMessage, placeholder, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className={dsTextField('root')}>
      {label ? <Label className={dsTextField('label')}>{label}</Label> : null}
      <Input className={dsTextField('input')} placeholder={placeholder} />
      {description ? <p className={dsTextField('description')}>{description}</p> : null}
      <FieldError className={dsTextField('error')}>{errorMessage ?? ''}</FieldError>
    </AriaTextField>
  );
}
