import log from 'electron-log';
import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { Modal } from 'antd';
import SearchNotes from './SearchNotes';

interface Props {
  trash: boolean;
  handleOn: Function;
}

const MoveToModalComponent = React.memo(
  forwardRef(function MoveToModalComponent({ trash, handleOn }: Props, ref) {
    const [isModalMoveToOpen, setIsModalMoveToOpen] = useState(false);

    const showModal = () => {
      setIsModalMoveToOpen(true);
    };

    const handleOk = () => {
      setIsModalMoveToOpen(false);
      handleOn();
    };

    const handleCancel = () => {
      setIsModalMoveToOpen(false);
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          open: () => {
            showModal();
          },
        };
      },
      []
    );

    return (
      <Modal
        title="Move to..."
        open={isModalMoveToOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <SearchNotes
          trash={trash}
          onSelect={handleOk}
          excludeParentNotesKeyProp={[]}
        />
      </Modal>
    );
  })
);

export default MoveToModalComponent;
