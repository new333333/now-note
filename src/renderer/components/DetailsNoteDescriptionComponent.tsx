import log from 'electron-log';
import { useContext, useRef, useState, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../css/quill.snow-now-note.css';
import 'quill-mention';
import 'quill-mention/dist/quill.mention.min.css';
import htmlEditButton from 'quill-html-edit-button';
import QuillImageDropAndPaste from 'quill-image-drop-and-paste';
import { AssetDTO, NoteDTO, SearchResult, SearchResultOptions } from 'types';
import { useDebouncedCallback } from 'use-debounce';
import ImageAsset from 'renderer/ImageAsset';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import UIApiDispatch from 'renderer/UIApiDispatch';

ReactQuill.Quill.register({
  'modules/htmlEditButton': htmlEditButton,
});
ReactQuill.Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);
ReactQuill.Quill.register('formats/imageAsset', ImageAsset);

const DetailsNoteDescriptionQuillLog = log.scope(
  'DetailsNoteDescriptionComponent'
);

export default function DetailsNoteDescriptionComponent() {
  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNoteDescription = useDetailsNoteStore(
    (state) => state.description
  );
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);

  const uiApi = useContext(UIApiDispatch);

  const updateDescription = useDetailsNoteStore(
    (state) => state.updateDescription
  );
  const [saved, setSaved] = useState(true);

  DetailsNoteDescriptionQuillLog.debug(`render`);

  const editorRef = useRef(null);

  const debounceDescription = useDebouncedCallback((value) => {
    if (value !== null && detailsNoteKey !== null) {
      nowNoteAPI.modifyNote({
        key: detailsNoteKey,
        description: value,
      });
      setSaved(true);
    }
  }, 2000);

  const onChange = useCallback(
    async (content: string, b, source: string) => {
      DetailsNoteDescriptionQuillLog.debug(
        `NoteDescriptionQuill.onChange() content=${content} b=, source=${source}, d=`,
        b
      );
      if (detailsNoteKey === null || source === 'api') {
        return;
      }
      updateDescription(detailsNoteKey, content);
      setSaved(false);
      debounceDescription(content);
    },
    [debounceDescription, updateDescription, detailsNoteKey]
  );

  const handleKeydown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 's' && event.ctrlKey) {
        debounceDescription.flush();
      }
    },
    [debounceDescription]
  );

  const clickedNoteLinkKey = useCallback(
    async (targetParam: HTMLElement | null): Promise<string | undefined> => {
      let target: HTMLElement | null = targetParam;
      while (target !== null) {
        if (target.classList.contains('mention') && target.dataset.id) {
          return target.dataset.id;
        }
        target = target.parentElement;
      }
      return undefined;
    },
    []
  );

  useEffect(() => {
    if (editorRef.current === null) {
      return;
    }
    editorRef.current.editor.root.addEventListener(
      'click',
      async (event: PointerEvent) => {
        const key = await clickedNoteLinkKey(event.target);
        if (key !== undefined) {
          const { openDetailNote } = uiApi;
          await openDetailNote(key);
        }
      }
    );
  }, [clickedNoteLinkKey, uiApi]);

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
    'imageAsset',
  ];

  const mentionSource = useCallback(
    async (searchTerm: string, renderList: Function, mentionChar: string) => {
      DetailsNoteDescriptionQuillLog.debug(
        `mention.source() searchTerm=${searchTerm} mentionChar=${mentionChar}`
      );
      const values = [];
      const searchResultOptions: SearchResultOptions = {
        parentNotesKey: [],
        types: [],
        dones: [],
        sortBy: '',
        offset: 0,
      };

      const searchResult: SearchResult = await nowNoteAPI.search(
        searchTerm,
        20,
        false,
        searchResultOptions
      );

      DetailsNoteDescriptionQuillLog.debug(
        `searchTerm=${searchTerm} searchResult=`,
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
    []
  );

  const imageHandler = useCallback(async (imageDataUrl, type, imageData) => {
    const fileType = imageData.type;
    const fileName = imageData.name;
    const base64 = imageData.dataUrl;

    const asset: AssetDTO = await nowNoteAPI.addImageAsBase64(
      fileType,
      fileName,
      base64
    );

    DetailsNoteDescriptionQuillLog.debug(`imageHandler() asset=`, asset);

    const quill = editorRef.current.editor;
    DetailsNoteDescriptionQuillLog.debug(`NoteDescriptionQuill imageHandler() quill=`, quill);
    let { index } = quill.getSelection() || {};
    if (index === undefined || index < 0) {
      index = quill.getLength();
    }
    DetailsNoteDescriptionQuillLog.debug(`imageHandler() index=`, index);
    const imageSrc = `nn-asset://${asset.key}`;
    DetailsNoteDescriptionQuillLog.debug(`imageHandler() imageSrc=`, imageSrc);
    quill.insertEmbed(index, 'imageAsset', imageSrc, 'user');
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
    imageDropAndPaste: {
      // add an custom image handler
      handler: imageHandler,
    },
  };

  if (detailsNoteKey === undefined) {
    return null;
  }

  return (
    <ReactQuill
      className={!saved ? 'not-saved' : ''}
      style={{ borderColor: 'orange' }}
      onKeyDown={handleKeydown}
      ref={editorRef}
      theme="snow"
      value={detailsNoteDescription || ''}
      onChange={onChange}
      modules={modules}
      formats={formats}
      readOnly={detailsNoteTrash || false}
    />
  );
}
