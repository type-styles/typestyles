import type { ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { dsDialog } from '@examples/design-system';
import { Button } from './Button';

export type DialogProps = {
  triggerLabel: string;
  title: string;
  description: ReactNode;
  closeLabel?: string;
};

export function Dialog({ triggerLabel, title, description, closeLabel = 'Close' }: DialogProps) {
  return (
    <DialogTrigger>
      <Button intent="secondary">{triggerLabel}</Button>
      <ModalOverlay className={dsDialog('overlay')}>
        <Modal className={dsDialog('modal')}>
          <AriaDialog>
            {({ close }) => (
              <div className={dsDialog('content')}>
                <Heading slot="title" className={dsDialog('heading')}>
                  {title}
                </Heading>
                <p className={dsDialog('description')}>{description}</p>
                <Button onPress={close}>{closeLabel}</Button>
              </div>
            )}
          </AriaDialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
