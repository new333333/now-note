import log from 'electron-log';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { ConfigProvider, Modal, Popconfirm, Progress } from 'antd';
import '../css/App.scss';
import useNoteStore from 'renderer/GlobalStore';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { HitMode, NoteDTO, SettingsDTO } from 'types';
import UIApiDispatch, { UIApi } from 'renderer/UIApiDispatch';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import useReindexingRepository from 'renderer/useReindexingRepository';
import SelectRepository from './SelectRepository';
import Footer from './Footer';
import SearchNotes from './SearchNotes';
import TreeComponent from './TreeComponent';
import AddNoteButtonComponent from './AddNoteButtonComponent';
import TrashButton from './TrashButton';
import DetailsNoteComponent from './DetailsNoteComponent';
import MoveToModalComponent from './MoveToModalComponent';

const appLog = log.scope('App');

interface TreeComponentAPI {
  getActiveNodeKey(): string | undefined;
  addNode(newNote: NoteDTO): Promise<NoteDTO | undefined>;
  removeNode(key: string): Promise<NoteDTO | undefined>;
  updateNode(note: NoteDTO): Promise<void>;
  focusNode(key: string): Promise<void>;
  reloadNode(key: string): Promise<boolean>;
  move(key: string, to: string, hitMode: HitMode): Promise<boolean>;
}

interface DetailsNoteComponentAPI {
  setFocus(): Promise<void>;
}

interface MoveToModalComponentAPI {
  open(key: string): Promise<void>;
}

export default function App() {
  const [reindexingProgress, reindexIfNeeded, reindexRepository] =
    useReindexingRepository();

  const treeComponentRef = useRef<TreeComponentAPI>(null);
  const detailsNoteComponentRef = useRef<DetailsNoteComponentAPI>(null);
  const moveToModalComponentRef = useRef<MoveToModalComponentAPI>(null);

  const [currentRepository, setCurrentRepository, trash] = useNoteStore(
    (state) => [
      state.currentRepository,
      state.setCurrentRepository,
      state.trash,
    ]
  );

  const detailsNoteUpdateNote = useDetailsNoteStore(
    (state) => state.updateNote
  );
  const detailsNoteUpdateBacklinks = useDetailsNoteStore(
    (state) => state.updateBacklinks
  );
  const detailsNoteUpdateNoteProperties = useDetailsNoteStore(
    (state) => state.updateNoteProperties
  );

  const uiApi: UIApi = useMemo(() => {
    return {
      addNote: async (key: string): Promise<NoteDTO | undefined> => {
        if (treeComponentRef.current === null) {
          return undefined;
        }

        let parentKey: string | undefined = key;

        if (key === 'ON_ACTIVE_TREE_NODE') {
          parentKey = treeComponentRef.current.getActiveNodeKey();
        }

        if (parentKey === undefined) {
          return undefined;
        }

        const newNote: NoteDTO | undefined = await nowNoteAPI.addNote(
          parentKey,
          { title: '', type: 'note' },
          'firstChild'
        );

        if (newNote === undefined) {
          return undefined;
        }

        await treeComponentRef.current.addNode(newNote);
        if (detailsNoteComponentRef.current === null) {
          return undefined;
        }
        await detailsNoteComponentRef.current.setFocus();
        await uiApi.openDetailNote(newNote);
        return newNote;
      },
      deleteNote: async (key: string) => {
        if (treeComponentRef.current === null) {
          return false;
        }
        let note = await nowNoteAPI.getNoteWithDescription(key);
        if (note === undefined) {
          return false;
        }
        if (note.trash) {
          await nowNoteAPI.deletePermanently(key);
        } else {
          await nowNoteAPI.moveNoteToTrash(key);
        }
        await treeComponentRef.current.removeNode(key);
        note = await nowNoteAPI.getNoteWithDescription(key);
        await uiApi.openDetailNote(note);
        return true;
      },
      restoreNote: async (key: string) => {
        if (treeComponentRef.current === null) {
          return false;
        }
        await nowNoteAPI.restore(key);
        await treeComponentRef.current.removeNode(key);
        const note = await nowNoteAPI.getNoteWithDescription(key);
        if (note !== undefined) {
          await uiApi.openDetailNote(note);
          if (note.key !== undefined && note.key !== null) {
            await treeComponentRef.current.reloadNode(note.parent);
          }
        }
        return true;
      },
      openDetailNote: async (noteOrKey: NoteDTO | string | undefined) => {
        let note: NoteDTO | undefined;
        if (typeof noteOrKey === 'string') {
          note = await nowNoteAPI.getNoteWithDescription(noteOrKey, false);
        } else {
          note = noteOrKey;
        }
        console.log(`openDetailNote note=`, note);
        detailsNoteUpdateNote(note);
        if (note === undefined) {
          detailsNoteUpdateBacklinks([]);
        }
        if (note !== undefined && note.key !== undefined && note.key !== null) {
          detailsNoteUpdateBacklinks(await nowNoteAPI.getBacklinks(note.key));
          await uiApi.focusNodeInTree(note.key);
          nowNoteAPI.modifySettings({
            detailsNoteKey: note.key,
          });
        }
      },
      updateDetailNote: async (note: NoteDTO) => {
        console.log(`updateDetailNote note=`, note);
        detailsNoteUpdateNoteProperties(note);
        if (note.key !== undefined && note.key !== null) {
          detailsNoteUpdateBacklinks(await nowNoteAPI.getBacklinks(note.key));
        }
      },
      updateNodeInTree: async (note: NoteDTO): Promise<void> => {
        console.log(`updateNodeInTree note=`, note);
        if (treeComponentRef.current === null) {
          return;
        }
        await treeComponentRef.current.updateNode(note);
      },
      focusNodeInTree: async (key: string) => {
        console.log(`focusNodeInTree key=`, key);
        if (treeComponentRef.current === null) {
          return;
        }
        await treeComponentRef.current.focusNode(key);
      },
      openMoveToDialog: async (key: string) => {
        console.log(`focusNodeInTree key=`, key);
        if (moveToModalComponentRef.current === null) {
          return;
        }
        moveToModalComponentRef.current.open(key);
      },
    };
  }, [
    detailsNoteUpdateBacklinks,
    detailsNoteUpdateNote,
    detailsNoteUpdateNoteProperties,
  ]);

  // **********************************************************************************

  const fetchCurrentRepository = useCallback(async () => {
    setCurrentRepository(await nowNoteAPI.getCurrentRepository());

    const settings: SettingsDTO = await nowNoteAPI.getSettings();
    if (
      settings !== null &&
      settings !== undefined &&
      settings.detailsNoteKey !== null &&
      settings.detailsNoteKey !== undefined
    ) {
      const note: NoteDTO | undefined = await nowNoteAPI.getNoteWithDescription(
        settings.detailsNoteKey
      );
      if (note !== null && note !== undefined) {
        uiApi.openDetailNote(note);
      }
    }

    await reindexIfNeeded();
  }, [reindexIfNeeded, setCurrentRepository, uiApi]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

  appLog.debug(`currentRepository=${currentRepository} trash=${trash}`);

  const handleOnSelectSearch = async (key: string) => {
    const note = await nowNoteAPI.getNoteWithDescription(key);
    if (note === undefined) {
      return;
    }
    uiApi.openDetailNote(note);
  };

  const handleOnselectMoveTo = async (key: string, moveToKey: string) => {
    appLog.debug(`handleOnselectMoveTo key=${key} moveToKey=${moveToKey}`);
    await nowNoteAPI.moveNote(key, moveToKey, 'over', undefined);
    if (treeComponentRef.current !== null) {
      await treeComponentRef.current.move(key, moveToKey, 'over');
    }
    await uiApi.openDetailNote(key);
  };

  const selectRepository = <SelectRepository />;

  let reflexContainer = null;

  if (currentRepository !== undefined && reindexingProgress === 100) {
    reflexContainer = (
      <ReflexContainer orientation="horizontal">
        <ReflexElement minSize={35} maxSize={35} style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: 8,
              backgroundColor: '#eeeeee',
              borderBottom: '1px solid #dddddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SearchNotes
              trash={trash}
              onSelect={handleOnSelectSearch}
              excludeParentNotesKeyProp={[]}
              excludeNotesKeyProp={[]}
            />
          </div>
        </ReflexElement>
        <ReflexElement>
          <ReflexContainer orientation="vertical">
            <ReflexElement className="left-bar" minSize={200} flex={0.25}>
              <div className="n3-bar-vertical">
                <AddNoteButtonComponent />
                <TreeComponent ref={treeComponentRef} />
                <TrashButton />
              </div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement className="right-bar" minSize={200} flex={0.75}>
              <DetailsNoteComponent ref={detailsNoteComponentRef} />
            </ReflexElement>
          </ReflexContainer>
        </ReflexElement>
        <ReflexElement minSize={37} maxSize={37} style={{ overflow: 'hidden' }}>
          <Footer reindexRepository={reindexRepository} />
        </ReflexElement>
      </ReflexContainer>
    );
  }

  const reindexIngProgressComponent =
    reindexingProgress !== 100 ? (
      <div
        style={{
          justifyContent: 'center',
          display: 'flex',
          height: '100%',
          alignItems: 'center',
        }}
      >
        <Progress
          type="circle"
          percent={reindexingProgress}
          size={400}
          format={(percent) => `Reindexing repository ${percent}%`}
        />
      </div>
    ) : null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      <UIApiDispatch.Provider value={uiApi}>
        {reindexingProgress !== 100 && reindexIngProgressComponent}
        {currentRepository === undefined && selectRepository}
        {reflexContainer}
        <MoveToModalComponent
          ref={moveToModalComponentRef}
          trash={trash}
          handleOn={handleOnselectMoveTo}
        />
      </UIApiDispatch.Provider>
    </ConfigProvider>
  );
}
