import log from 'electron-log';
import { useEffect, useRef, useCallback, createContext, useMemo } from 'react';
import { ConfigProvider, Space } from 'antd';
import '../css/App.scss';
import useNoteStore from 'renderer/GlobalStore';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import SelectRepository from './SelectRepository';
import Footer from './Footer';
import SearchNotes from './SearchNotes';
import TreeComponent from './TreeComponent';
import AddNoteButtonComponent from './AddNoteButtonComponent';
import TrashButton from './TrashButton';
import DetailsNoteComponent from './DetailsNoteComponent';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { Note } from 'main/modules/DataModels';

const appLog = log.scope('App');

export const NowNoteDispatch = createContext(null);

export function App() {
  const treeComponentRef = useRef(null);
  const detailsNoteComponentRef = useRef(null);

  const [currentRepository, setCurrentRepository, trash] = useNoteStore(
    (state) => [
      state.currentRepository,
      state.setCurrentRepository,
      state.trash,
    ]
  );

  const fetchCurrentRepository = useCallback(async () => {
    setCurrentRepository(await nowNoteAPI.getCurrentRepository());
  }, [setCurrentRepository]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

  appLog.debug(`currentRepository=${currentRepository} trash=${trash}`);

  const detailsNoteUpdateNote = useDetailsNoteStore(
    (state) => state.updateNote
  );
  const detailsNoteUpdateBacklinks = useDetailsNoteStore(
    (state) => state.updateBacklinks
  );
  const detailsNoteUpdateNoteProperties = useDetailsNoteStore(
    (state) => state.updateNoteProperties
  );

  const uiApi = useMemo(() => {
    return {
      addNote: async (key: string): Promise<Note | undefined> => {
        console.log(`addNote! call! key`, key);
        if (treeComponentRef.current === null) {
          return undefined;
        }
        const newNote = await treeComponentRef.current.addNote(key);
        if (detailsNoteComponentRef.current === null) {
          return undefined;
        }
        await detailsNoteComponentRef.current.setFocus();
        await uiApi.openDetailNote(newNote);
        return newNote;
      },
      deleteNote: async (key: string) => {
        if (treeComponentRef.current === null) {
          return undefined;
        }
        await nowNoteAPI.moveNoteToTrash(key);
        await treeComponentRef.current.removeNode(key);
        // TODO: open node again?
        await uiApi.openDetailNote(
          await nowNoteAPI.getNoteWithDescription(key)
        );
        return true;
      },
      openDetailNote: async (note: Note) => {
        console.log(`openDetailNote note=`, note);
        detailsNoteUpdateNote(note);
        detailsNoteUpdateBacklinks(await nowNoteAPI.getBacklinks(note.key));
        await uiApi.focusNodeInTree(note.key);
      },
      updateDetailNote: async (note: Note) => {
        console.log(`updateDetailNote note=`, note);
        detailsNoteUpdateNoteProperties(note);
        detailsNoteUpdateBacklinks(await nowNoteAPI.getBacklinks(note.key));
      },
      updateNodeInTree: async (note: Note) => {
        console.log(`updateNodeInTree note=`, note);
        if (treeComponentRef.current === null) {
          return undefined;
        }
        await treeComponentRef.current.updateNode(note);
        return undefined;
      },
      focusNodeInTree: async (key: string) => {
        console.log(`focusNodeInTree key=`, key);
        if (treeComponentRef.current === null) {
          return undefined;
        }
        await treeComponentRef.current.focusNode(key);
        return undefined;
      },
    };
  }, [
    detailsNoteUpdateBacklinks,
    detailsNoteUpdateNote,
    detailsNoteUpdateNoteProperties,
  ]);

  const selectRepository = <SelectRepository />;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      {currentRepository === undefined && selectRepository}
      {currentRepository !== undefined &&
        <NowNoteDispatch.Provider value={uiApi}>
          <ReflexContainer orientation="vertical">
            <ReflexElement className="left-bar" minSize="200" flex={0.25}>
              <div className="n3-bar-vertical">
                <AddNoteButtonComponent />
                <TreeComponent ref={treeComponentRef} />
                <div id="nn-trash">
                  <TrashButton />
                </div>
              </div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement className="right-bar" minSize="200" flex={0.75}>
              <div className="n3-bar-vertical">
                <div className="nn-header">
                  <SearchNotes />
                </div>
                <DetailsNoteComponent ref={detailsNoteComponentRef} />
              </div>
            </ReflexElement>
          </ReflexContainer>
          <Footer />
        </NowNoteDispatch.Provider>
      }
    </ConfigProvider>
  );
}
