import { useContext, useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';
import { SaveTwoTone } from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';

export default function NoteDescriptionQuill() {
  const [note, setDescription] = useNoteStore((state) => [
    state.detailsNote,
    state.setDescription,
  ]);
  const [saved, setSaved] = useState(true);

  const editorRef = useRef(null);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const debounceDescription = useDebouncedCallback((value) => {
    if (value !== null && note !== undefined) {
      uiController.modifyNote({
        key: note.key,
        description: value,
      });
      setSaved(true);
    }
  }, 2000);

  const onChange = useCallback(
    async (content: string, delta, source, editor) => {
      setDescription(content);
      setSaved(false);
      debounceDescription(content);
    },
    [debounceDescription, setDescription]
  );

  const handleKeydown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 's' && event.ctrlKey) {
        debounceDescription.flush();
      }
    },
    [debounceDescription]
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'background'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'background',
  ];

  if (note === undefined) {
    return null;
  }

  return (
    <>
      <ReactQuill
        onKeyDown={handleKeydown}
        ref={editorRef}
        theme="snow"
        value={note.description || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
      {saved && <SaveTwoTone twoToneColor="#00ff00" />}
      {!saved && <SaveTwoTone twoToneColor="#ff0000" />}
    </>
  );
}
