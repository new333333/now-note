import log from 'electron-log';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Collapse, Badge } from 'antd';
import { blue } from '@ant-design/colors';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

const { Panel } = Collapse;

const DetailsNoteBacklinksComponentLog = log.scope(
  'DetailsNoteBacklinksComponent'
);

export default function DetailsNoteBacklinksComponent() {
  const backlinks = useDetailsNoteStore((state) => state.backlinks);
  const noteKey = useDetailsNoteStore((state) => state.noteKey);

  DetailsNoteBacklinksComponentLog.debug(`render backlinks=${backlinks}`);

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
                  />
                </li>
              )})}
          </ul>
        }
      </Panel>
    </Collapse>
  );
}

