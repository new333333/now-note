import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useContext,
  useMemo,
} from 'react';
import log from 'electron-log';
import { blue } from '@ant-design/colors';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import {
  HitMode,
  NoteDTO,
  TreeComponentAPI,
  FancyTreeComponentAPI,
} from 'types';
import UIApiDispatch from 'renderer/UIApiDispatch';
import FancyTreeComponent, {
  FancyTreeDataProvider,
} from './FancyTreeComponent';

const treeLog = log.scope('Tree');

const NotesTreeComponent = React.memo(
  forwardRef(function NotesTreeComponent(props, ref) {
    const domRef = useRef<FancyTreeComponentAPI>(null);

    const uiApi = useContext(UIApiDispatch);

    // is trash view? reload tree -> in useEffect(() => initTree, trash
    const trash = useNoteStore((state) => state.trash);

    const handleChangeType = useCallback(
      async (key: string, type: string) => {
        // treeLog.debug(`handleChangeType key=${key}, type=${type}`);
        if (uiApi === null) {
          return;
        }
        // treeLog.debug(`handleChangeType key=${key}, type=${type}`);
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          type,
        });
        uiApi.updateDetailNote(modifiedNote);
        uiApi.updateNodeInTree(modifiedNote);
      },
      [uiApi]
    );

    const handleSearch = useCallback(
      async (key: string) => {
        if (uiApi === null) {
          return;
        }
        uiApi.search(key);
      },
      [uiApi]
    );

    /*********************************************************************************** */



    // const notesDataProvider = new NotesDataProvider();

    const notesDataProvider: FancyTreeDataProvider = useMemo(() => {
      class NotesDataProvider extends FancyTreeDataProvider {
        constructor() {
          super();
          console.log("NotesDataProvider CONSTRUCTOR >>>>>>>>>>>>>");
        }

        async getRootNotes(): Promise<NoteDTO[] | undefined> {
          console.log("NotesDataProvider >>> getRootNotes");
          const notes = await nowNoteAPI.getChildren(null, trash);
          console.log("NotesDataProvider >>> getRootNotes, notes=", notes);
          return notes;
        }

        async getChildrenNotes(key: string): Promise<NoteDTO[] | undefined> {
          console.log("NotesDataProvider >>> getChildrenNotes");
          return nowNoteAPI.getChildren(key);
        }

        async getNoteWithDescription(
          key: string,
          withDescription: boolean
        ): Promise<NoteDTO | undefined> {
          return nowNoteAPI.getNoteWithDescription(key, withDescription);
        }
      }
      return new NotesDataProvider();
    }, [trash]);

    const handleOpenDetailNote = useCallback(
      (key: string): void => {
        const { openDetailNote } = uiApi;
        openDetailNote(key);
      },
      [uiApi]
    );

    const handleChangeDone = useCallback(
      async (key: string, done: boolean) => {
        // treeLog.debug(`handleChangeDone key=${key}, done=${done}`);
        if (uiApi === null) {
          return;
        }
        // treeLog.debug(`handleChangeDone key=${key}, done=${done}`);
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          done,
        });
        const { updateDetailNote } = uiApi;
        updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    const handleChangeTitle = useCallback(
      async (key: string, title: string) => {
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          title,
        });
        if (uiApi === null) {
          return;
        }
        uiApi.updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    const handleChangeExpanded = useCallback(
      async (key: string, expanded: boolean) => {
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          expanded,
        });
        if (uiApi === null) {
          return;
        }
        uiApi.updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    useImperativeHandle(
      ref,
      () => {
        return {
          updateNode: async (note: NoteDTO): Promise<void> => {
            return notesDataProvider.updateNode(note);
          },
          getActiveNodeKey: (): string | undefined => {
            return notesDataProvider.getActiveNodeKey();
          },
          addNode: async (newNote: NoteDTO): Promise<NoteDTO | undefined> => {
            return notesDataProvider.addNode(newNote);
          },
          removeNode: (key: string): void => {
            notesDataProvider.removeNode(key);
          },
          focusNode: async (key: string): Promise<void> => {
            return notesDataProvider.focusNode(key);
          },
          reloadNode: async (key: string): Promise<boolean> => {
            return notesDataProvider.reload(key);
          },
          move: (
            key: string,
            to: string | undefined | null,
            hitMode: HitMode
          ): Promise<boolean> => {
            return notesDataProvider.move(key, to, hitMode);
          },
        };
      },
      [notesDataProvider]
    );

    return (
      <FancyTreeComponent
        readOnly={trash}
        onClick={handleOpenDetailNote}
        onSelect={handleChangeDone}
        onChangeTitle={handleChangeTitle}
        onExpand={handleChangeExpanded}
        dataProvider={notesDataProvider}
        onOpenDetailNote={handleOpenDetailNote}
        ref={domRef}
      />
    );
  })
);

export default NotesTreeComponent;
