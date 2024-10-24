import log from 'electron-log';
import { useCallback } from 'react';
import { Button } from 'antd';
import { DeleteFilled } from '@ant-design/icons';
import useNoteStore from 'renderer/GlobalStore';

export default function TrashButton() {
  const [trash, setTrash, search, setSearch] = useNoteStore((state) => [
    state.trash,
    state.setTrash,
    state.search,
    state.setSearch,
  ]);

  const openTrash = useCallback(() => {
    setTrash(true);
    setSearch(false);
  }, [setTrash, setSearch]);

  const closeTrash = useCallback(() => {
    setTrash(false);
    setSearch(false);
  }, [setTrash, setSearch]);

  let trashButton = (
    <Button
      size="small"
      icon={<DeleteFilled />}
      onClick={openTrash}
    />
  );

  if (trash) {
    trashButton = (
      <Button
        size="small"
        danger
        icon={<DeleteFilled />}
        onClick={closeTrash}
      />
    );
  }

  return (
    <>
      {trashButton}
    </>
  );
}
