import log from 'electron-log';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { ConfigProvider } from 'antd';
import '../css/App.scss';
import useNoteStore from 'renderer/GlobalStore';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { NoteDTO, SettingsDTO } from 'types';
import UIApiDispatch, { UIApi } from 'renderer/UIApiDispatch';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import SelectRepository from './SelectRepository';
import Footer from './Footer';
import SearchNotes from './SearchNotes';
import TreeComponent from './TreeComponent';
import AddNoteButtonComponent from './AddNoteButtonComponent';
import TrashButton from './TrashButton';
import DetailsNoteComponent from './DetailsNoteComponent';

const appLog = log.scope('App');

interface TreeComponentAPI {
  getActiveNodeKey(): string | undefined;
  addNote(newNote: NoteDTO): Promise<NoteDTO | undefined>;
  removeNode(key: string): Promise<NoteDTO | undefined>;
  restoreNote(key: string): Promise<NoteDTO | undefined>;
  updateNode(note: NoteDTO): Promise<void>;
  focusNode(key: string): Promise<void>;
  reloadNode(key: string): Promise<boolean>;
}

interface DetailsNoteComponentAPI {
  setFocus(): Promise<void>;
}

export default function App() {
  const treeComponentRef = useRef<TreeComponentAPI>(null);
  const detailsNoteComponentRef = useRef<DetailsNoteComponentAPI>(null);

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

        await treeComponentRef.current.addNote(newNote);
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
        await nowNoteAPI.moveNoteToTrash(key);
        await treeComponentRef.current.removeNode(key);
        const note = await nowNoteAPI.getNoteWithDescription(key);
        if (note !== undefined) {
          await uiApi.openDetailNote(note);
        }
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
        }
        return true;
      },
      openDetailNote: async (note: NoteDTO) => {
        console.log(`openDetailNote note=`, note);
        detailsNoteUpdateNote(note);
        if (note.key !== undefined && note.key !== null) {
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
    };
  }, [
    detailsNoteUpdateBacklinks,
    detailsNoteUpdateNote,
    detailsNoteUpdateNoteProperties,
  ]);

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
  }, [setCurrentRepository, uiApi]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

  appLog.debug(`currentRepository=${currentRepository} trash=${trash}`);

  const selectRepository = <SelectRepository />;

  const reflexContainer = (
    <ReflexContainer orientation="horizontal">
      <ReflexElement minSize={35} maxSize={35}>
        <SearchNotes />
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
        <Footer />
      </ReflexElement>
    </ReflexContainer>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      <UIApiDispatch.Provider value={uiApi}>
        {currentRepository === undefined && selectRepository}
        {currentRepository !== undefined && reflexContainer}
      </UIApiDispatch.Provider>
    </ConfigProvider>
  );
}
