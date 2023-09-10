import log from 'electron-log';
import { useCallback } from 'react';
import { Button } from 'antd';
import { DeleteFilled } from '@ant-design/icons';
import useNoteStore from 'renderer/NoteStore';

export default function TrashButton() {
  const [trash, setTrash] = useNoteStore((state) => [
    state.trash,
    state.setTrash,
  ]);

  const openTrash = useCallback(() => {
    setTrash(true);
  }, [setTrash]);

  const closeTrash = useCallback(() => {
    setTrash(false);
  }, [setTrash]);

  if (trash) {
    return (
      <Button
        size="small"
        type="text"
        danger
        icon={<DeleteFilled />}
        onClick={closeTrash}
      >
        Close Trash
      </Button>
    );
  }

  return (
    <Button
      size="small"
      type="text"
      icon={<DeleteFilled />}
      onClick={openTrash}
    >
      Trash
    </Button>
  );
}
