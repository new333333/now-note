import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Collapse, Badge } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { blue } from '@ant-design/colors';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import NoteBreadCrumb from './NoteBreadCrumb';

const { Panel } = Collapse;

interface Props {
  noteKey: string;
  initValue?: NoteDataModel[];
}

export default function DetailsNoteBacklinks({ noteKey, initValue }: Props) {
  const [backlinks, setBacklinks] = useState<NoteDataModel[] | undefined>([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchBacklinks = useCallback(async () => {
    setBacklinks(await uiController.getBacklinks(noteKey));
  }, [uiController, noteKey]);

  useEffect(() => {
    if (initValue !== undefined) {
      setBacklinks(initValue);
    } else {
      fetchBacklinks();
    }
  }, [fetchBacklinks, initValue]);

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
            {backlinks.map((note) => {
              return (
                <li key={note.key}>
                  <NoteBreadCrumb noteKey={note.key} />
                </li>
              )})}
          </ul>
        }
      </Panel>
    </Collapse>
  );
}

DetailsNoteBacklinks.defaultProps = {
  initValue: undefined,
};
