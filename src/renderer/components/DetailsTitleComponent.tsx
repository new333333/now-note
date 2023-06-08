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
import { DataServiceContext } from 'renderer/DataServiceContext';
import { NoteService } from 'types';
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

  const { dataService }: { dataService: NoteService } =
    useContext(DataServiceContext);

  const fetchTitle = useCallback(async () => {
    const note: Note | undefined = await dataService.getNote(noteKey);
    const updateTitle = note !== undefined ? note.title : '';
    setTitle(updateTitle);
  }, [dataService, noteKey]);

  const handleChangeTitle = useCallback(async () => {
    await dataService.modifyNote({
      key: noteKey,
      title,
    });
  }, [dataService, noteKey, title]);

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
