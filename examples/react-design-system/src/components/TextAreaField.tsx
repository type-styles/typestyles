import { FieldError, Label, TextArea, TextField as AriaTextField } from 'react-aria-components';
import { dsTextAreaField } from '@examples/design-system';
import type { BaseTextFieldProps } from './utils';

export type TextAreaFieldProps = BaseTextFieldProps & {
  placeholder?: string;
};

export function TextAreaField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextAreaFieldProps) {
  return (
    <AriaTextField {...props} className={dsTextAreaField('root')}>
      {label ? <Label className={dsTextAreaField('label')}>{label}</Label> : null}
      <TextArea className={dsTextAreaField('input')} placeholder={placeholder} />
      {description ? <p className={dsTextAreaField('description')}>{description}</p> : null}
      <FieldError className={dsTextAreaField('error')}>{errorMessage ?? ''}</FieldError>
    </AriaTextField>
  );
}
