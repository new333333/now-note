import log from 'electron-log';
import { useContext, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-mention';
import 'quill-mention/dist/quill.mention.min.css';
import htmlEditButton from 'quill-html-edit-button';
import { UIControllerContext, uiController } from 'renderer/UIControllerContext';
import { SearchResult, SearchResultOptions, UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';
import { SaveTwoTone } from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';

Quill.register({
  'modules/htmlEditButton': htmlEditButton,
});

export default function NoteDescriptionQuill() {
  const [note, setDescription] = useNoteStore((state) => [
    state.detailsNote,
    state.setDescription,
  ]);
  const [saved, setSaved] = useState(true);

  log.debug(`NoteDescriptionQuill note=`, note);

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
    async (content: string, b, source) => {
      log.debug(`NoteDescriptionQuill.onChange() content=${content} b=, source=${source}, d=`, b);
      if (note === undefined || source === 'api') {
        return;
      }
      setDescription(note.key, content);
      setSaved(false);
      debounceDescription(content);
    },
    [debounceDescription, setDescription, note]
  );

  const handleKeydown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 's' && event.ctrlKey) {
        debounceDescription.flush();
      }
    },
    [debounceDescription]
  );


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
    'mention',
  ];

  const mentionSource = useCallback(
    async (searchTerm: string, renderList: Function, mentionChar: string) => {
      log.debug(`NoteDescriptionQuill mention.source() searchTerm=${searchTerm} mentionChar=${mentionChar}`);
      const values = [];
      const searchResultOptions: SearchResultOptions = {
        parentNotesKey: [],
        types: [],
        dones: [],
        sortBy: '',
        offset: 0,
      };

      const searchResult: SearchResult = await uiController.search(
        searchTerm,
        20,
        false,
        searchResultOptions
      );

      log.debug(
        `NoteDescriptionQuill searchTerm=${searchTerm} searchResult=`,
        searchResult
      );

      searchResult.results.forEach((noteSerachResult) => {
        let shoWNotePath = noteSerachResult.titlePath.substring(
          2,
          noteSerachResult.titlePath.length - 2
        );
        shoWNotePath = shoWNotePath.replaceAll('/', ' / ');

        values.push({
          id: noteSerachResult.key,
          value: shoWNotePath,
        });
      });

      renderList(values, searchTerm);
    },
    [uiController]
  );

  const mentionOnselect = useCallback((item, insertItem) => {
    log.debug(
      `NoteDescriptionQuill mention.onSelect() insertItem=${insertItem} item=`,
      item
    );
    // return `<span>${item.value}</span>`;
    insertItem(item, true);
    /*
item= {
  index: '0',
  denotationChar: '/',
  id: '2cd397d6-e7f5-4d9a-a49f-4f338f73c85a',
  value: 'a'
}
    */
  }, []);

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
    mention: {
      allowedChars: /^[A-Za-z\s]*$/,
      mentionDenotationChars: ['/'],
      source: mentionSource,
    },
    htmlEditButton: {},
  };

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