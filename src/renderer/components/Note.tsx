import log from 'electron-log';
import { Divider, Typography } from 'antd';
import useNoteStore from 'renderer/NoteStore';
import DetailsPriorityComponent from './DetailsPriorityComponent';
import DetailsNoteBacklinks from './DetailsNoteBacklinks';
import DetailsTitleComponent from './DetailsTitleComponent';
import NoteDescriptionQuill from './NoteDescriptionQuill';
import DetailsTagsComponent from './DetailsTagsComponent';
import DetailsNoteType from './DetailsNoteType';
import DetailsMenu from './DetailsMenu';
import NoteBreadCrumb from './NoteBreadCrumb';
import DetailsNoteDone from './DetailsNoteDone';

const noteLog = log.scope('Note');

export default function Note() {
  const [note] = useNoteStore((state) => [state.detailsNote]);

  noteLog.debug(`note=`, note);

  return (
    <div id="nn-note">
      {note && (
        <>
          <div>
            <NoteBreadCrumb note={note} />
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {note.type === 'task' && (
              <div style={{ margin: '0 5px' }}>
                <DetailsNoteDone />
              </div>
            )}
            <div style={{ flexBasis: '100%' }}>
              <DetailsTitleComponent />
            </div>
            <div>
              <DetailsMenu note={note} />
            </div>
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ padding: '5px 0' }}>
            <DetailsNoteType />
            <DetailsPriorityComponent />
            <DetailsTagsComponent note={note} />
          </div>
          <Divider style={{ margin: '5px 0' }} />
          <div style={{ flex: 1 }}>
            <NoteDescriptionQuill />
          </div>
          <div>
            <DetailsNoteBacklinks note={note} />
          </div>
        </>
      )}
    </div>
  );
}
