import log from 'electron-log';
import {
  useState,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
} from 'react';
import { Input, Typography } from 'antd';
import { useDebouncedCallback } from 'use-debounce';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { NoteDTO } from 'types';
import UIApiDispatch from 'renderer/UIApiDispatch';

const { TextArea } = Input;
const { Paragraph } = Typography;

const detailsNoteTitleComponentLog = log.scope('DetailsNoteTitleComponent');

const DetailsNoteTitleComponent = forwardRef(function DetailsNoteTitleComponent(
  props,
  ref
) {
  const domRef = useRef<HTMLTextAreaElement>(null);

  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNoteTitle = useDetailsNoteStore((state) => state.title);
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);
  const updateNoteProperties = useDetailsNoteStore(
    (state) => state.updateNoteProperties
  );
  const updateBacklinks = useDetailsNoteStore((state) => state.updateBacklinks);

  const [value, setValue] = useState(detailsNoteTitle);
  const [saved, setSaved] = useState(true);

  const uiApi = useContext(UIApiDispatch);

  useImperativeHandle(
    ref,
    () => {
      return {
        setFocus: async () => {
          console.log(`DetailsNoteTitleComponent.setFocus()`);
          if (domRef.current === null) {
            return;
          }
          domRef.current.focus();
        },
      };
    },
    []
  );

  const debounceTitle = useDebouncedCallback(async (newValue) => {
    if (
      newValue === null ||
      detailsNoteKey === undefined ||
      detailsNoteKey === null ||
      uiApi === null
    ) {
      detailsNoteTitleComponentLog.debug('debounceTitle SKIP');
      return;
    }
    const modifiedNote: NoteDTO = await nowNoteAPI.modifyNote({
      key: detailsNoteKey,
      title: newValue,
    });
    updateNoteProperties(modifiedNote);
    setSaved(true);
    updateBacklinks(await nowNoteAPI.getBacklinks(detailsNoteKey));
    uiApi.updateNodeInTree(modifiedNote);
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

  if (detailsNoteKey === undefined) {
    return null;
  }

  return (
    <div style={{ display: 'flex', paddingRight: 5 }}>
      {detailsNoteTrash && (
        <Paragraph strong style={{ marginBottom: 0 }}>
          {detailsNoteTitle}
        </Paragraph>
      )}
      {!detailsNoteTrash && (
        <TextArea
          styles={
            !saved
              ? {
                  textarea: {
                    borderColor: 'orange',
                  },
                }
              : {}
          }
          ref={domRef}
          onKeyDown={handleKeydown}
          onBlur={handleBlur}
          size="large"
          value={value || ''}
          onChange={handleEditTitle}
          autoSize={{
            minRows: 1,
          }}
        />
      )}
    </div>
  );
});

export default DetailsNoteTitleComponent;
