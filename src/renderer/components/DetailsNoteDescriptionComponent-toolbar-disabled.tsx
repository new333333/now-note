import log from 'electron-log';
import { useContext, useRef, useState, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../css/quill.snow-now-note.css';
import 'quill-mention';
import 'quill-mention/dist/quill.mention.min.css';
import htmlEditButton from 'quill-html-edit-button';
import QuillImageDropAndPaste from 'quill-image-drop-and-paste';
import { AssetDTO, SearchResult, SearchResultOptions } from 'types';
import { useDebouncedCallback } from 'use-debounce';
import ImageAsset from 'renderer/ImageAsset';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import UIApiDispatch from 'renderer/UIApiDispatch';
import TextArea from 'antd/es/input/TextArea';

interface MentionResult {
  id: string | null | undefined;
  value: string;
}

// Custom Undo button icon component for Quill editor. You can import it directly
// from 'quill/assets/icons/undo.svg' but I found that a number of loaders do not
// handle them correctly
// eslint-disable-next-line react/function-component-definition
const CustomUndo = () => (
  <svg viewBox="0 0 18 18">
    <polygon className="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10" />
    <path
      className="ql-stroke"
      d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"
    />
  </svg>
);

// Redo button icon component for Quill editor
// eslint-disable-next-line react/function-component-definition
const CustomRedo = () => (
  <svg viewBox="0 0 18 18">
    <polygon className="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10" />
    <path
      className="ql-stroke"
      d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"
    />
  </svg>
);

const areSiblings = (parent: Element, subling: Element | null) => {
  if (parent === subling) {
    return true;
  }
  if (parent === null || subling === null) {
    return false;
  }
  if (parent === subling.parentNode) {
    return true;
  }
  return areSiblings(parent, subling.parentNode);
};

// Undo and redo functions for Custom Toolbar
function undoChange() {
  this.quill.history.undo();
}
function redoChange() {
  this.quill.history.redo();
}


// Add sizes to whitelist and register them
const Size = ReactQuill.Quill.import('formats/size');
Size.whitelist = ['extra-small', 'small', 'medium', 'large'];
ReactQuill.Quill.register(Size, true);

// Add fonts to whitelist and register them
const Font = ReactQuill.Quill.import('formats/font');
Font.whitelist = [
  'arial',
  'comic-sans',
  'courier-new',
  'georgia',
  'helvetica',
  'lucida',
];
ReactQuill.Quill.register(Font, true);

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

  const editorRef = useRef<ReactQuill>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const debounceDescription = useDebouncedCallback((value) => {
    if (value !== null && detailsNoteKey !== null) {
      nowNoteAPI.modifyNote({
        key: detailsNoteKey,
        description: value,
      });
      setSaved(true);
    }
  }, 2000);

  const onChangeSelection = useCallback(async (range, oldRange, source) => {
    // console.log(`onChangeSelection, range`, range);
    // console.log(`onChangeSelection, oldRange`, oldRange);
    // console.log(`onChangeSelection, source`, source);

    if (toolbarRef.current === null) {
      return;
    }

    if (
      oldRange === 'user' &&
      !toolbarRef.current.classList.contains('focused')
    ) {
      console.log(`onChangeSelection, onFous`);

      toolbarRef.current.classList.add('focused');
    }
    if (range == null && toolbarRef.current.classList.contains('focused')) {
      const isFocuedToolbar = areSiblings(
        toolbarRef.current,
        document.activeElement
      );

      if (!isFocuedToolbar) {
        toolbarRef.current.classList.remove('focused');
      }
    }
  }, []);

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
    async (targetParam: EventTarget | null): Promise<string | undefined> => {
      let target: EventTarget | null = targetParam;
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
    if (
      editorRef.current === null ||
      editorRef.current === undefined ||
      editorRef.current.editor === undefined
    ) {
      return;
    }
    editorRef.current.editor.root.addEventListener(
      'click',
      async (event: MouseEvent) => {
        const key = await clickedNoteLinkKey(event.target);
        if (key !== undefined) {
          const { openDetailNote } = uiApi;
          await openDetailNote(key);
        }
      }
    );

    if (toolbarRef.current === null || toolbarRef.current === undefined) {
      return;
    }

    toolbarRef.current.addEventListener(
      'focusin',
      async (event: FocusEvent) => {
        console.log(`click toolbar`);

        if (toolbarRef.current === null || toolbarRef.current === undefined) {
          return;
        }

        if (!toolbarRef.current.classList.contains('focused')) {
          console.log(`onChangeSelection, onFous`);
          toolbarRef.current.classList.add('focused');
        }
      }
    );
  }, [clickedNoteLinkKey, uiApi]);

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'align',
    'strike',
    'script',
    'blockquote',
    'background',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'code-block',
    'mention',
    'imageAsset',
    'video',
  ];

  const mentionSource = useCallback(
    async (searchTerm: string, renderList: Function, mentionChar: string) => {
      DetailsNoteDescriptionQuillLog.debug(
        `mention.source() searchTerm=${searchTerm} mentionChar=${mentionChar}`
      );
      const values: MentionResult[] = [];
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
        let shoWNotePath = '';

        if (noteSerachResult.titlePath !== undefined) {
          shoWNotePath = noteSerachResult.titlePath.substring(
            2,
            noteSerachResult.titlePath.length - 2
          );
          shoWNotePath = shoWNotePath.replaceAll('/', ' / ');
        }

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
    if (editorRef.current === null) {
      return;
    }
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
    if (quill === undefined) {
      return;
    }
    DetailsNoteDescriptionQuillLog.debug(
      `NoteDescriptionQuill imageHandler() quill=`,
      quill
    );
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
    toolbar: {
      container: '#toolbar',
      handlers: {
        undo: undoChange,
        redo: redoChange,
      },
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
    mention: {
      allowedChars: /^[A-Za-z\s]*$/,
      mentionDenotationChars: ['#'],
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
    <div>
      <div
        id="toolbar"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 1,
        }}
        ref={toolbarRef}
      >
        <span className="ql-formats">
          <select className="ql-font" defaultValue="arial">
            <option value="arial">Arial</option>
            <option value="comic-sans">Comic Sans</option>
            <option value="courier-new">Courier New</option>
            <option value="georgia">Georgia</option>
            <option value="helvetica">Helvetica</option>
            <option value="lucida">Lucida</option>
          </select>
          <select className="ql-size" defaultValue="medium">
            <option value="extra-small">Size 1</option>
            <option value="small">Size 2</option>
            <option value="medium">Size 3</option>
            <option value="large">Size 4</option>
          </select>
          <select className="ql-header" defaultValue="3">
            <option value="1">Heading</option>
            <option value="2">Subheading</option>
            <option value="3">Normal</option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
        </span>
        <span className="ql-formats">
          <button className="ql-script" value="super" />
          <button className="ql-script" value="sub" />
          <button className="ql-blockquote" />
          <button className="ql-direction" />
        </span>
        <span className="ql-formats">
          <select className="ql-align" />
          <select className="ql-color" />
          <select className="ql-background" />
        </span>
        <span className="ql-formats">
          <button className="ql-link" />
          <button className="ql-image" />
          <button className="ql-video" />
        </span>
        <span className="ql-formats">
          <button className="ql-formula" />
          <button className="ql-code-block" />
          <button className="ql-clean" />
        </span>
        <span className="ql-formats">
          <button className="ql-undo">
            <CustomUndo />
          </button>
          <button className="ql-redo">
            <CustomRedo />
          </button>
        </span>
      </div>
      <div>
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
          size="large"
          value={'Aaaa'}
          autoSize={{
            minRows: 1,
          }}
        />
      </div>
      <div data-text-editor="name">
        <ReactQuill
          scrollingContainer=".scroll-block"
          className={!saved ? 'not-saved' : ''}
          style={{ borderColor: 'orange' }}
          onKeyDown={handleKeydown}
          ref={editorRef}
          theme="snow"
          value={detailsNoteDescription || ''}
          onChange={onChange}
          onChangeSelection={onChangeSelection}
          modules={modules}
          formats={formats}
          readOnly={detailsNoteTrash || false}
          bounds={`[data-text-editor="name"]`}
        />
      </div>
    </div>
  );
}
