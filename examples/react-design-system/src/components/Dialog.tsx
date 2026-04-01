import type { JSX, ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { dialog } from '@examples/design-system';
import { Button } from './Button';

export type DialogProps = {
  triggerLabel: string;
  title: string;
  description: ReactNode;
  closeLabel?: string;
};

export function Dialog({ triggerLabel, title, description, closeLabel = 'Close' }: DialogProps): JSX.Element {
  return (
    <DialogTrigger>
      <Button intent="secondary">{triggerLabel}</Button>
      <ModalOverlay className={dialog('overlay')}>
        <Modal className={dialog('modal')}>
          <AriaDialog>
            {({ close }) => (
              <div className={dialog('content')}>
                <Heading slot="title" className={dialog('heading')}>
                  {title}
                </Heading>
                <p className={dialog('description')}>{description}</p>
                <Button onPress={close}>{closeLabel}</Button>
              </div>
            )}
          </AriaDialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
