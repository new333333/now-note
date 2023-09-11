import { useCallback, useContext, useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Note } from 'main/modules/DataModels';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';

interface Props {
  note: Note;
}

interface BreadCrumbElementNote {
  key: string;
  title: string;
}

export default function NoteBreadCrumb({ note }: Props) {
  const [updateDetailsNoteKey, updatedNote, detailsNote] = useNoteStore(
    (state) => [
      state.updateDetailsNoteKey,
      state.updatedNote,
      state.detailsNote,
    ]
  );
  const [path, setPath] = useState<BreadCrumbElementNote[]>([]);

  useEffect(() => {
    const keys = note.keyPath.substring(2, note.keyPath.length - 2).split('/');
    const titles = note.titlePath
      .substring(2, note.titlePath.length - 2)
      .split('/');
    const newPath: BreadCrumbElementNote[] = [];
    keys.forEach((key, index) => {
      newPath.push({
        key,
        title: titles[index],
      });
    });
    setPath(newPath);
  }, [note.keyPath, note.titlePath]);

  /*

  useEffect(() => {
    // update displayed title, when detailsNote chnages
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
*/

  useEffect(() => {
    // update displayed title, when detailsNote chnages
    console.log('NoteBreadCrumb detailsNote=', detailsNote);
    if (detailsNote === undefined || !('title' in detailsNote)) {
      return;
    }

    const { key } = detailsNote;
    const { title } = detailsNote;

    console.log('NoteBreadCrumb key=, title=', key, title);
    path.forEach((el: BreadCrumbElementNote) => {
      if (el.key === key) {
        el.title = title;
      }
    });
    console.log('NoteBreadCrumb path=', path);
    // setPath([...path]);

  }, [detailsNote, path]);

  const openNote = useCallback(
    (key: string) => {
      updateDetailsNoteKey(key);
    },
    [updateDetailsNoteKey]
  );

  return (
    <Breadcrumb>
      {path.map((el: BreadCrumbElementNote, index) => {
        return (
          <Breadcrumb.Item
            key={el.key}
            href="#"
            onClick={() => {
              openNote(el.key);
            }}
          >
            {el.title}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
