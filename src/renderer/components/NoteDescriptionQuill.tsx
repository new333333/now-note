import log from 'electron-log';
import { useContext, useRef, useState, useCallback, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-mention';
import 'quill-mention/dist/quill.mention.min.css';
import htmlEditButton from 'quill-html-edit-button';
import QuillImageDropAndPaste from 'quill-image-drop-and-paste';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { SearchResult, SearchResultOptions, UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';
import { SaveTwoTone } from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';
import { Asset } from 'main/modules/DataModels';
import ImageAsset from 'renderer/ImageAsset';

ReactQuill.Quill.register({
  'modules/htmlEditButton': htmlEditButton,
});
ReactQuill.Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);
ReactQuill.Quill.register('formats/imageAsset', ImageAsset);

export default function NoteDescriptionQuill() {
  const [note, setDescription, updateDetailsNoteKey] = useNoteStore((state) => [
    state.detailsNote,
    state.setDescription,
    state.updateDetailsNoteKey,
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
    async (content: string, b, source: string) => {
      console.log(
        `NoteDescriptionQuill.onChange() content=${content} b=, source=${source}, d=`,
        b
      );
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
          updateDetailsNoteKey(key);
        }
      }
    );
  }, [clickedNoteLinkKey, updateDetailsNoteKey]);

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
      log.debug(
        `NoteDescriptionQuill mention.source() searchTerm=${searchTerm} mentionChar=${mentionChar}`
      );
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

  const imageHandler = useCallback(
    async (imageDataUrl, type, imageData) => {
      const fileType = imageData.type;
      const fileName = imageData.name;
      const base64 = imageData.dataUrl;

      const asset: Asset = await uiController.addImageAsBase64(
        fileType,
        fileName,
        base64
      );

      log.debug(`NoteDescriptionQuill imageHandler() asset=`, asset);

      const quill = editorRef.current.editor;
      console.log(`NoteDescriptionQuill imageHandler() quill=`, quill);
      let { index } = quill.getSelection() || {};
      if (index === undefined || index < 0) {
        index = quill.getLength();
      }
      log.debug(`NoteDescriptionQuill imageHandler() index=`, index);
      const imageSrc = `nn-asset://${asset.key}`;
      log.debug(`NoteDescriptionQuill imageHandler() imageSrc=`, imageSrc);

      // quill.insertEmbed(
      //  index,
      //  'image',
      //  'aaa://s3-eu-west-1.amazonaws.com/fs.dev-lds.ru/avatars/16dd6beb-c3fd-94e8-cbe5-0699bcea9454.jpg',
      //  'user'
      //  );

      quill.insertEmbed(index, 'imageAsset', imageSrc, 'user');

      // imageDataUrl=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAACCAIAAAAM38H+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAAArSURBVBhXY/gPBpMmTVFQVIGwkUFISHhZWQWQAVUHBBClEASRgwCQiKIKAGmFNmklmg1IAAAAAElFTkSuQmCC
      // type = image/png
      /*
        imageData= {
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAACCAIAAAAM38H+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAAArSURBVBhXY/gPBpMmTVFQVIGwkUFISHhZWQWQAVUHBBClEASRgwCQiKIKAGmFNmklmg1IAAAAAElFTkSuQmCC',
          type: 'image/png',
          name: 'MzYxNTEzLjk0NDY1MTUzMDUzMTY5NDYwNTM0OTg5OA=.png'
        }
      */

/*
      const blob = imageData.toBlob();
      const file = imageData.toFile();

      console.log(`NoteDescriptionQuill imageHandler() blob=`, blob);
      console.log(`NoteDescriptionQuill imageHandler() blob.text=`, await blob.text());
      console.log(`NoteDescriptionQuill imageHandler() file=`, file);
*/
  /*
      const blob = imageData.toBlob()
      const file = imageData.toFile()

      // generate a form data
      const formData = new FormData()

      // append blob data
      formData.append('file', blob)

      // or just append the file
      formData.append('file', file)

      // upload image to your server
      callUploadAPI(your_upload_url, formData, (err, res) => {
        if (err) return
        // success? you should return the uploaded image's url
        // then insert into the quill editor
        let index = (quill.getSelection() || {}).index
        if (index === undefined || index < 0) index = quill.getLength()
        quill.insertEmbed(index, 'image', res.data.image_url, 'user')
      })*/
    },
    [uiController]
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
