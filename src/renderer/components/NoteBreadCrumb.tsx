import { useCallback, useContext, useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';

interface Props {
  noteKey: string;
}

export default function NoteBreadCrumb({ noteKey }: Props) {
  const [parents, setParent] = useState<NoteDataModel[]>([]);
  const [updateDetailsNoteKey, updatedNote, detailsNote] = useNoteStore(
    (state) => [
      state.updateDetailsNoteKey,
      state.updatedNote,
      state.detailsNote,
    ]
  );

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchParents = useCallback(async () => {
    const newParemts = (await uiController.getParents(noteKey)) || [];
    setParent(newParemts);
  }, [uiController, noteKey]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  useEffect(() => {
    // console.log('NoteBreadCrumb updatedNote=', updatedNote);
    if (updatedNote === undefined || !('title' in updatedNote)) {
      return;
    }
    const { key } = updatedNote;
    const { title } = updatedNote;

    // console.log('NoteBreadCrumb key=, title=', key, title);
    setParent((prevParenst) => {
      // console.log('NoteBreadCrumb prevParenst=', prevParenst);
      prevParenst.map((note) => {
        if (note.key === key) {
          note.title = title || '';
        }
        return true;
      });
      return [...prevParenst];
    });
  }, [updatedNote, setParent]);

  useEffect(() => {
    // console.log('NoteBreadCrumb detailsNote=', detailsNote);
    if (detailsNote === undefined || !('title' in detailsNote)) {
      return;
    }

    const { key } = detailsNote;
    const { title } = detailsNote;

    // console.log('NoteBreadCrumb key=, title=', key, title);
    setParent((prevParenst) => {
      // console.log('NoteBreadCrumb prevParenst=', prevParenst);
      prevParenst.map((note) => {
        if (note.key === key) {
          note.title = title || '';
        }
        return true;
      });
      return [...prevParenst];
    });
  }, [detailsNote, setParent]);

  const openNote = useCallback(
    (key: string) => {
      updateDetailsNoteKey(key);
    },
    [updateDetailsNoteKey]
  );

  return (
    <Breadcrumb>
      {parents &&
        parents.map((parentNote) => (
          <Breadcrumb.Item
            key={parentNote.key}
            href="#"
            onClick={() => {
              openNote(parentNote.key);
            }}
          >
            {parentNote.type === 'link' &&
              `TODO: linkToKey {parentNote.linkToKey}`}
            {parentNote.type !== 'link' && parentNote.title}
          </Breadcrumb.Item>
        ))}
    </Breadcrumb>
  );
}
