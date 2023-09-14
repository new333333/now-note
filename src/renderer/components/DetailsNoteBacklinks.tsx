import log from 'electron-log';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Collapse, Badge } from 'antd';
import { Note, Note as NoteDataModel } from 'main/modules/DataModels';
import { blue } from '@ant-design/colors';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import NoteBreadCrumb from './NoteBreadCrumb';

const { Panel } = Collapse;

interface Props {
  note: Note;
}

export default function DetailsNoteBacklinks({ note }: Props) {
  const [backlinks, setBacklinks] = useState<NoteDataModel[] | undefined>([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  // log.debug(`DetailsNoteBacklinks noteKey=${noteKey}`);

  const fetchBacklinks = useCallback(async () => {
    // log.debug(`DetailsNoteBacklinks.fetchBacklinks() note.Key=${note.key}`);
    setBacklinks(await uiController.getBacklinks(note.key));
  }, [uiController, note]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  return (
    <Collapse bordered={false}>
      <Panel
        key={note.key}
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
                  <NoteBreadCrumb note={backlinkNote} />
                </li>
              )})}
          </ul>
        }
      </Panel>
    </Collapse>
  );
}

