import log from 'electron-log';
import React, { useContext, useCallback } from 'react';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import UIApiDispatch from 'renderer/UIApiDispatch';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { NoteDTO } from 'types';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

const BreadCrumbElementNoteLog = log.scope('BreadCrumbElementNote');

export default function DetailsNoteBreadCrumbComponent() {
  const keyPath = useDetailsNoteStore((state) => state.keyPath);
  const titlePath = useDetailsNoteStore((state) => state.titlePath);

  const uiApi = useContext(UIApiDispatch);

  const openNote = useCallback(
    async (key: string) => {
      // log.debug(`NoteBreadCrumb click on key=${key}`);
      const note: NoteDTO | undefined = await nowNoteAPI.getNoteWithDescription(
        key
      );
      if (note === undefined || uiApi === null) {
        return;
      }
      const { openDetailNote } = uiApi;
      await openDetailNote(note);
    },
    [uiApi]
  );

  if (keyPath === null || titlePath === null) {
    return null;
  }

  return (
    <NoteBreadCrumbComponent
      keyPath={keyPath}
      titlePath={titlePath}
      handleOnClick={openNote}
    />
  );
}
