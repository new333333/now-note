import log from 'electron-log';
import {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { Input, Typography } from 'antd';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { HitMode, NoteDTO, UIController } from 'types';
import { Note } from 'main/modules/DataModels';

const { TextArea } = Input;
const { Paragraph } = Typography;

interface Props {
  readOnly: boolean;
  noteKey: string;
  initValue: string;
}

export default function DetailsTitleComponent({
  readOnly,
  noteKey,
  initValue,
}: Props) {
  const [title, setTitle] = useState('');
  const titleDomRef = useRef(null);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchTitle = useCallback(async () => {
    const note: Note | undefined = await uiController.getNote(noteKey);
    const updateTitle = note !== undefined ? note.title : '';
    setTitle(updateTitle);
  }, [uiController, noteKey]);

  const handleChangeTitle = useCallback(async () => {
    await uiController.modifyNote({
      key: noteKey,
      title,
    });
  }, [uiController, noteKey, title]);

  const handleKeydown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 's' && event.ctrlKey) {
        handleChangeTitle();
      }
    },
    [handleChangeTitle]
  );

  const handleEditTitle = useCallback(
    async (event: ChangeEvent<HTMLTextAreaElement>) => {
      setTitle(event.target.value);
    },
    []
  );

  useEffect(() => {
    if (initValue !== undefined) {
      setTitle(initValue);
    } else {
      fetchTitle();
    }
  }, [fetchTitle, initValue]);

  const titleChangeListener = useCallback(
    async (
      trigger: string,
      parentNoteKey: string,
      note: NoteDTO,
      hitMode: HitMode,
      relativeToKey: string,
      newNote: NoteDTO
    ) => {
      log.debug(
        `I'm listener to add note (trigger: ${trigger}, parentNoteKey: ${parentNoteKey}, note: ${note}, hitMode: ${hitMode}, relativeToKey: ${relativeToKey}, newNote: ${newNote})`
      );
      // TODO: set focus on title?
    },
    []
  );

  useEffect(() => {
    uiController.subscribe('addNote', 'after', titleChangeListener);
    return () => {
      uiController.unsubscribe('addNote', 'after', titleChangeListener);
    };
  }, [titleChangeListener, uiController]);

  return (
    <>
      {readOnly && (
        <Paragraph strong style={{ marginBottom: 0 }}>
          {title}
        </Paragraph>
      )}
      {!readOnly && (
        <TextArea
          onKeyDown={handleKeydown}
          onBlur={handleChangeTitle}
          size="large"
          bordered={false}
          ref={titleDomRef}
          value={title}
          onChange={handleEditTitle}
          autoSize={{
            minRows: 1,
          }}
        />
      )}
    </>
  );
}
