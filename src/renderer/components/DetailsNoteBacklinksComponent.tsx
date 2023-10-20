import log from 'electron-log';
import { useCallback, useContext } from 'react';
import { Collapse, Badge } from 'antd';
import { blue } from '@ant-design/colors';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { NoteDTO } from 'types';
import UIApiDispatch from 'renderer/UIApiDispatch';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

const { Panel } = Collapse;

const DetailsNoteBacklinksComponentLog = log.scope(
  'DetailsNoteBacklinksComponent'
);

export default function DetailsNoteBacklinksComponent() {
  const backlinks = useDetailsNoteStore((state) => state.backlinks);
  const noteKey = useDetailsNoteStore((state) => state.noteKey);

  DetailsNoteBacklinksComponentLog.debug(`render backlinks=${backlinks}`);

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

  if (noteKey === null) {
    return null;
  }

  return (
    <Collapse bordered={false}>
      <Panel
        key={noteKey}
        style={{ padding: '0' }}
        header={
          <>
            Linked from &nbsp;
            {backlinks &&
              <Badge
                count={backlinks.length}
                style={{ backgroundColor: blue[5] }}
              />}
          </>
        }
      >
        {backlinks &&
          <ul>
            {backlinks.map((backlinkNote) => {
              return (
                <li key={backlinkNote.key}>
                  <NoteBreadCrumbComponent
                    keyPath={backlinkNote.keyPath}
                    titlePath={backlinkNote.titlePath}
                    handleOnClick={openNote}
                  />
                </li>
              )})}
          </ul>
        }
      </Panel>
    </Collapse>
  );
}

