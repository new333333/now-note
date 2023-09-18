import log from 'electron-log';
import { useCallback, useEffect, useState, useContext } from 'react';
import { Breadcrumb } from 'antd';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { Note } from 'main/modules/DataModels';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const noteBreadCrumbLog = log.scope('NoteBreadCrumbComponent');

interface Props {
  keyPath: string;
  titlePath: string;
}

export default function NoteBreadCrumbComponent({ keyPath, titlePath }: Props) {
  const updateNote = useDetailsNoteStore((state) => state.updateNote);
  const updateBacklinks = useDetailsNoteStore((state) => state.updateBacklinks);


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
    async (key: string) => {
      // log.debug(`NoteBreadCrumb click on key=${key}`);
      const note: Note | undefined = await nowNoteAPI.getNoteWithDescription(
        key
      );
      if (note !== undefined) {
        updateNote(note);
        updateBacklinks(await nowNoteAPI.getBacklinks(key));
      }
    },
    [updateNote, updateBacklinks]
  );

  if (
    keyPath === null ||
    keyPath === undefined ||
    keyPath.length === 0 ||
    titlePath === null ||
    titlePath === undefined ||
    titlePath.length === 0
  ) {
    return null;
  }

  const items = [];
  const keys = keyPath.substring(2, keyPath.length - 2).split('/');
  const titles = titlePath.substring(2, titlePath.length - 2).split('/');
  keys.forEach((key, index) => {
    items.push({
      title: titles[index],
      href: '#',
      onClick: () => {
        openNote(key);
      },
    });
  });

  return <Breadcrumb items={items} />;
}
