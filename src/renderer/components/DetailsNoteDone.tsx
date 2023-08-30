import { useContext } from 'react';
import { Checkbox, Tooltip } from 'antd';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';

export default function DetailsNoteDone() {
  const [note, setDone] = useNoteStore((state) => [
    state.detailsNote,
    state.setDone,
  ]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const handleChangeDone = async () => {
    if (note !== undefined) {
      await uiController.modifyNote({
        key: note.key,
        done: !note.done,
      });
      setDone(!note.done);
    }
  };

  return (
    <>
      {note &&
        <Tooltip placement="bottom" title={`Mark as{note.done ? ' NOT' : ''} Done`}>
          <Checkbox
            disabled={note.trash}
            checked={note.done}
            onChange={handleChangeDone}
          />
        </Tooltip>}
    </>
  );
}
