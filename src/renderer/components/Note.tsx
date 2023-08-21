import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { Divider, Typography } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import DetailsPriorityComponent from './DetailsPriorityComponent';
import NoteBacklinks from './NoteBacklinks';
import DetailsTitleComponent from './DetailsTitleComponent';
import { NoteDescription } from './NoteDescription';
import DetailsTagsComponent from './DetailsTagsComponent';
import DetailsNoteType from './DetailsNoteType';
import DetailsMenu from './DetailsMenu';
import NoteBreadCrumb from './NoteBreadCrumb';
import NoteDone from './NoteDone';

const { Text } = Typography;

interface Props {
  noteKey: string;
  initValue: NoteDataModel;
  trash: boolean;
}

export default function Note({ noteKey, initValue, trash }: Props) {
  const descriptionDomRef = useRef(null);
  const [note, setNote] = useState<NoteDataModel | undefined>(undefined);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchNote = useCallback(async () => {
    setNote(await uiController.getNote(noteKey));
  }, [uiController, noteKey]);

  useEffect(() => {
    if (initValue !== undefined) {
      setNote(initValue);
    } else {
      fetchNote();
    }
  }, [fetchNote, initValue]);

  return (
    <div id="nn-note">
      {!note && <Text type="secondary">No note selected.</Text>}
      {note && (
        <>
          <div>
            <NoteBreadCrumb noteKey={note.key} />
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            { /*<>
                <FontAwesomeIcon icon={solid('user-secret')} />
            </>*/}
            {note.type === 'task' && (
              <div style={{ margin: '0 5px' }}>
                <NoteDone
                  noteKey={note.key}
                  disabled={trash}
                  initValue={note.done}
                />
              </div>
            )}
            <div style={{ flexBasis: '100%' }}>
              <DetailsTitleComponent
                readOnly={trash}
                noteKey={note.key}
                initValue={note.title}
              />
            </div>
            <div>
              <DetailsMenu
                readOnly={trash}
                noteKey={note.key}
                updatedAt={note.updatedAt}
                createdAt={note.createdAt}
                createdBy={note.createdBy}
              />
            </div>
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ padding: '5px 0' }}>
            <DetailsNoteType
              readOnly={trash}
              noteKey={note.key}
              initValue={note.type}
            />
            <DetailsPriorityComponent
              readOnly={trash}
              noteKey={note.key}
              initValue={note.priority}
            />
            <DetailsTagsComponent readOnly={trash} noteKey={note.key} />
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ flex: 1 }}>
            <NoteDescription
              ref={descriptionDomRef}
              noteKey={note.key}
              description={note.description}
              disabled={trash}
            />
          </div>
          <div>
            <NoteBacklinks noteKey={note.key} />
          </div>
        </>
      )}
    </div>
  );
}
