import log from 'electron-log';
import {
  useState,
  useCallback,
  useContext,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
  useRef,
} from 'react';
import { Input, Typography } from 'antd';
import { useDebouncedCallback } from 'use-debounce';
import { SaveTwoTone } from '@ant-design/icons';
import { Note } from 'main/modules/DataModels';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const { TextArea } = Input;
const { Paragraph } = Typography;

const detailsNoteTitleComponentLog = log.scope('DetailsNoteTitleComponent');

export default function DetailsNoteTitleComponent() {
  const domRef = useRef(null);

  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNoteTitle = useDetailsNoteStore((state) => state.title);
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);
  const updateNoteProperties = useDetailsNoteStore(
    (state) => state.updateNoteProperties
  );
  const updateBacklinks = useDetailsNoteStore((state) => state.updateBacklinks);

  const [value, setValue] = useState(detailsNoteTitle);
  const [saved, setSaved] = useState(true);

  const debounceTitle = useDebouncedCallback(async (newValue) => {
    if (
      newValue === null ||
      detailsNoteKey === undefined ||
      detailsNoteKey === null
    ) {
      detailsNoteTitleComponentLog.debug('debounceTitle SKIP');
      return;
    }
    const modifiedNote: Note = await nowNoteAPI.modifyNote({
      key: detailsNoteKey,
      title: newValue,
    });
    updateNoteProperties(modifiedNote);
    setSaved(true);
    updateBacklinks(await nowNoteAPI.getBacklinks(detailsNoteKey));
  }, 2000);

  const handleBlur = useCallback(async () => {
    debounceTitle.flush();
  }, [debounceTitle]);

  const handleKeydown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === '/') {
        // prevent onChange
        event.preventDefault();
      }
      if ((event.key === 's' && event.ctrlKey) || event.key === 'Enter') {
        debounceTitle.flush();
        // prevent onChange
        event.preventDefault();
      }
    },
    [debounceTitle]
  );

  const handleEditTitle = useCallback(
    async (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value
        // remove /
        .replaceAll(/\//gi, '')
        // remove end of lines
        .replaceAll(/(?:\r\n|\r|\n)/g, '');
      setSaved(false);
      // setTitle(note.key, value);
      setValue(newValue);
      debounceTitle(newValue);
    },
    [debounceTitle, setValue]
  );

  // TreeComponent on change title
  useEffect(() => {
    setValue(detailsNoteTitle);
  }, [detailsNoteTitle]);

  /*
  TODO
  useEffect(() => {
    // console.log(
    //   'Title set focus: detailsNoteTitleFocus=',
    //   detailsNoteTitleFocus
    // );
    if (detailsNoteTitleFocus && domRef.current !== null) {
      domRef.current.focus();
    }
    setDetailsNoteTitleFocus(false);
  }, [detailsNoteTitleFocus, setDetailsNoteTitleFocus]);
*/

  if (detailsNoteKey === undefined) {
    return null;
  }

  return (
    <div style={{ display: 'flex' }}>
      {detailsNoteTrash && (
        <Paragraph strong style={{ marginBottom: 0 }}>
          {detailsNoteTitle}
        </Paragraph>
      )}
      {!detailsNoteTrash && (
        <TextArea
          ref={domRef}
          onKeyDown={handleKeydown}
          onBlur={handleBlur}
          size="large"
          bordered={false}
          value={value}
          onChange={handleEditTitle}
          autoSize={{
            minRows: 1,
          }}
        />
      )}
      {saved && <SaveTwoTone twoToneColor="#00ff00" />}
      {!saved && <SaveTwoTone twoToneColor="#ff0000" />}
    </div>
  );
}
