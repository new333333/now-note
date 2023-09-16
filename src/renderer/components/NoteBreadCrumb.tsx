import log from 'electron-log';
import { useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Note } from 'main/modules/DataModels';
import useNoteStore from 'renderer/NoteStore';

const noteBreadCrumbLog = log.scope('NoteBreadCrumb');

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
    noteBreadCrumbLog.debug(
      `useEffect() note.keyPath=${note.keyPath}, note.titlePath=${note.titlePath}`
    );
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
    // log.debug('NoteBreadCrumb updatedNote=', updatedNote);
    if (updatedNote === undefined || !('title' in updatedNote)) {
      return;
    }
    const { key } = updatedNote;
    const { title } = updatedNote;

    // log.debug('NoteBreadCrumb key=, title=', key, title);
    setParent((prevParenst) => {
      // log.debug('NoteBreadCrumb prevParenst=', prevParenst);
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
/*
  useEffect(() => {
    // update displayed title, when detailsNote chnages
    noteBreadCrumbLog.debug('NoteBreadCrumb detailsNote=', detailsNote);
    if (detailsNote === undefined || !('title' in detailsNote)) {
      return;
    }

    const { key } = detailsNote;
    const { title } = detailsNote;

    noteBreadCrumbLog.debug('NoteBreadCrumb key=, title=', key, title);
    path.forEach((el: BreadCrumbElementNote) => {
      if (el.key === key) {
        el.title = title;
      }
    });
    noteBreadCrumbLog.debug('NoteBreadCrumb path=', path);
    // setPath([...path]);

  }, [detailsNote, path]);
*/
  const openNote = useCallback(
    (key: string) => {
      // log.debug(`NoteBreadCrumb click on key=${key}`);
      updateDetailsNoteKey(key);
    },
    [updateDetailsNoteKey]
  );

  const items = path.map((el: BreadCrumbElementNote) => {
    return {
      title: el.title,
      onClick: () => {
        // log.debug(`NoteBreadCrumb click on el=`, el);
        openNote(el.key);
      },
    };
  });

  return <Breadcrumb items={items} />;
}
