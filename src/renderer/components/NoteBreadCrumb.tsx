import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';

interface Props {
  noteKey: string;
  initValue: NoteDataModel[];
}

export default function NoteBreadCrumb({ noteKey, initValue }: Props) {
  const [parents, setParent] = useState<NoteDataModel[] | undefined>([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchParents = useCallback(async () => {
    setParent(await uiController.getParents(noteKey));
  }, [uiController, noteKey]);

  useEffect(() => {
    if (initValue !== undefined) {
      setParent(initValue);
    } else {
      fetchParents();
    }
  }, [fetchParents, initValue]);

  const openNote = useCallback(async () => {
    await uiController.openNote(noteKey);
  }, [uiController, noteKey]);

  return (
    <Breadcrumb>
      {parents &&
        parents.map((parentNote, index) => (
          <Breadcrumb.Item key={parentNote.key} href="#" onClick={openNote}>
            {parentNote.type === 'link' &&
              `TODO: linkToKey {parentNote.linkToKey}`}
            {parentNote.type !== 'link' && parentNote.title}
          </Breadcrumb.Item>
        ))}
    </Breadcrumb>
  );
}
