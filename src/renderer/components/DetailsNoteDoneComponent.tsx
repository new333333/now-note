import log from 'electron-log';
import { useCallback } from 'react';
import { Checkbox, Tooltip } from 'antd';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const noteDoneComponentLog = log.scope('DetailsNoteDoneComponent');

export default function DetailsNoteDoneComponent() {
  const noteKey = useDetailsNoteStore((state) => state.noteKey);
  const done = useDetailsNoteStore((state) => state.done);
  const trash = useDetailsNoteStore((state) => state.trash);
  const type = useDetailsNoteStore((state) => state.type);

  const updateDone = useDetailsNoteStore((state) => state.updateDone);

  noteDoneComponentLog.debug(`noteKey=${noteKey} done=${done} trash=${trash}`);

  const handleChangeDone = useCallback(async () => {
    if (noteKey === null || noteKey === undefined) {
      return;
    }
    updateDone(noteKey, !done);
    nowNoteAPI.modifyNote({
      key: noteKey,
      done: !done,
    });
  }, [done, noteKey, updateDone]);

  if (
    noteKey === undefined ||
    trash === null ||
    done === null ||
    type === null ||
    type === undefined
  ) {
    return null;
  }

  if (type !== 'task') {
    return null;
  }

  return (
    <div style={{ margin: '0 5px' }}>
      <Tooltip placement="bottom" title={`Mark as{done ? ' NOT' : ''} Done`}>
        <Checkbox disabled={trash} checked={done} onChange={handleChangeDone} />
      </Tooltip>
    </div>
  );
}
