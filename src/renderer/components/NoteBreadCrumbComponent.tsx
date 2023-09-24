import log from 'electron-log';
import { useCallback, useContext } from 'react';
import { Breadcrumb } from 'antd';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { NoteDTO } from 'types';
import UIApiDispatch from 'renderer/UIApiDispatch';

const noteBreadCrumbLog = log.scope('NoteBreadCrumbComponent');

interface Props {
  keyPath: string;
  titlePath: string;
}

export default function NoteBreadCrumbComponent({ keyPath, titlePath }: Props) {
  const uiApi = useContext(UIApiDispatch);

  const openNote = useCallback(
    async (key: string) => {
      // log.debug(`NoteBreadCrumb click on key=${key}`);
      const note: NoteDTO | undefined = await nowNoteAPI.getNoteWithDescription(
        key
      );
      if (note === undefined && uiApi === null) {
        return;
      }
      await uiApi.openDetailNote(note);
    },
    [uiApi]
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
