import { useCallback, useContext, useEffect, useState } from 'react';
import { Checkbox, Tooltip } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';

interface Props {
  noteKey: string;
  initValue: boolean;
  disabled: boolean;
}

export default function NoteDone({ noteKey, initValue, disabled }: Props) {
  const [checked, setChecked] = useState(false);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchDone = useCallback(async () => {
    const note: NoteDataModel | undefined = await uiController.getNote(noteKey);
    if (note !== undefined) {
      setChecked(note.done);
    }
  }, [uiController, noteKey]);

  useEffect(() => {
    if (initValue !== undefined) {
      setChecked(initValue);
    } else {
      fetchDone();
    }
  }, [fetchDone, initValue]);

  const handleChangeDone = async () => {
    await uiController.modifyNote({
      key: noteKey,
      done: !checked,
    });
    setChecked(!checked);
  };

  return (
    <Tooltip placement="bottom" title={`Mark as{note.done ? ' NOT' : ''} Done`}>
      <Checkbox
        disabled={disabled}
        checked={checked}
        onChange={handleChangeDone}
      />
    </Tooltip>
  );
}
