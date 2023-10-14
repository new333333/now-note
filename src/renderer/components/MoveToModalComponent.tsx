import log from 'electron-log';
import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { Modal } from 'antd';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import SearchNotes from './SearchNotes';

interface Props {
  trash: boolean;
  handleOn: Function;
}

const MoveToModalComponent = React.memo(
  forwardRef(function MoveToModalComponent({ trash, handleOn }: Props, ref) {
    const [isModalMoveToOpen, setIsModalMoveToOpen] = useState(false);
    const [key, setKey] = useState<string | undefined>(undefined);
    const [parent, setParent] = useState<string | undefined>(undefined);

    const showModal = async (noteKey: string) => {
      const note = await nowNoteAPI.getNoteWithDescription(noteKey, true);
      if (note !== undefined && note.parent !== null) {
        setParent(note.parent);
      }
      setKey(noteKey);
      setIsModalMoveToOpen(true);
    };

    const handleOk = (moveToKey: string) => {
      setIsModalMoveToOpen(false);
      handleOn(key, moveToKey);
    };

    const handleCancel = () => {
      setIsModalMoveToOpen(false);
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          open: (noteKey: string) => {
            showModal(noteKey);
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
        key:{key}
        <SearchNotes
          trash={trash}
          onSelect={handleOk}
          excludeParentNotesKeyProp={key !== undefined ? [key] : []}
          excludeNotesKeyProp={parent !== undefined ? [parent] : []}
        />
      </Modal>
    );
  })
);

export default MoveToModalComponent;
