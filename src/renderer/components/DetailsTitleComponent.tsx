import {
  useState,
  useCallback,
  useContext,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
  useRef,
} from 'react';
import useNoteStore from 'renderer/NoteStore';
import { Input, Typography } from 'antd';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import { useDebouncedCallback } from 'use-debounce';
import { SaveTwoTone } from '@ant-design/icons';

const { TextArea } = Input;
const { Paragraph } = Typography;

export default function DetailsTitleComponent() {
  const domRef = useRef(null);

  const [note, setTitle, detailsNoteTitleFocus, setDetailsNoteTitleFocus] =
    useNoteStore((state) => [
      state.detailsNote,
      state.setTitle,
      state.detailsNoteTitleFocus,
      state.setDetailsNoteTitleFocus,
    ]);

  const [saved, setSaved] = useState(true);
  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const debounceTitle = useDebouncedCallback((value) => {
    if (value !== null && note !== undefined) {
      uiController.modifyNote({
        key: note.key,
        title: value || '',
      });
      setSaved(true);
    } else {
      console.log('debounceTitle SKIP');
    }
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
      const value = event.target.value
        // remove /
        .replaceAll(/\//gi, '')
        // remove end of lines
        .replaceAll(/(?:\r\n|\r|\n)/g, '');
      setSaved(false);
      if (note !== undefined) {
        setTitle(note.key, value);
        debounceTitle(value);
      }
    },
    [debounceTitle, note, setTitle]
  );

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

  if (note === undefined) {
    return null;
  }

  return (
    <div style={{ display: 'flex' }}>
      {note.trash && (
        <Paragraph strong style={{ marginBottom: 0 }}>
          {note.title}
        </Paragraph>
      )}
      {!note.trash && (
        <TextArea
          ref={domRef}
          onKeyDown={handleKeydown}
          onBlur={handleBlur}
          size="large"
          bordered={false}
          value={note.title}
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
