import log from 'electron-log';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Button, ConfigProvider, Modal, Space, Tabs } from 'antd';
import '../css/App.scss';
import useNoteStore from 'renderer/GlobalStore';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import {
  CreateLinkModalComponentAPI,
  DetailsNoteComponentAPI,
  HitMode,
  MoveToModalComponentAPI,
  NoteDTO,
  OpenHistoryDTO,
  SearchModalComponentAPI,
  SettingsDTO,
  TreeComponentAPI,
  UserSettingsRepository,
} from 'types';
import UIApiDispatch, { UIApi } from 'renderer/UIApiDispatch';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import useReindexingRepository from 'renderer/useReindexingRepository';
import SelectRepository from './SelectRepository';
import RepositoryTitleComponent from './RepositoryTitleComponent';
import AdvancedSearchButtonComponent from './AdvancedSearchButtonComponent';
import TreeReactComponent from './TreeReactComponent';
import AddNoteButtonComponent from './AddNoteButtonComponent';
import TrashButtonComponent from './TrashButtonComponent';
import DetailsNoteComponent from './DetailsNoteComponent';
import MoveToModalComponent from './MoveToModalComponent';
import CreateLinkModalComponent from './CreateLinkModalComponent';
import NextPrevButtonsComponent from './NextPrevButtonsComponent';
import SearchModalComponent from './SearchModalComponent';
import SearchPanelComponent from './SearchPanelComponent';
import NotesTreeComponent from './NotesTreeComponent';
import { FolderOutlined } from '@ant-design/icons';

const appLog = log.scope('App');

export default function App() {
  const [
    reindexingProgress,
    reindexIfNeeded,
    reindexRepository,
    reindexingProgressComponent,
  ] = useReindexingRepository();

  const [searchInNoteKey, setSearchInNoteKey] = useState<string | undefined>(
    undefined
  );

  const [modalDeleteConfirm, contextHolderDeleteConfirm] = Modal.useModal();
  const treeComponentRef = useRef<TreeComponentAPI>(null);
  const detailsNoteComponentRef = useRef<DetailsNoteComponentAPI>(null);
  const moveToModalComponentRef = useRef<MoveToModalComponentAPI>(null);
  const createLinkModalComponentRef = useRef<CreateLinkModalComponentAPI>(null);

  const [
    currentRepository,
    setCurrentRepository,
    trash,
    setTrash,
    search,
    setSearch,
  ] = useNoteStore((state) => [
    state.currentRepository,
    state.setCurrentRepository,
    state.trash,
    state.setTrash,
    state.search,
    state.setSearch,
  ]);

  // const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
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
      setRepository: async (
        repository: UserSettingsRepository
      ): Promise<void> => {
        setCurrentRepository(repository);
        const settings: SettingsDTO = await nowNoteAPI.getSettings();
        if (
          settings !== null &&
          settings !== undefined &&
          settings.detailsNoteKey !== null &&
          settings.detailsNoteKey !== undefined
        ) {
          const note: NoteDTO | undefined =
            await nowNoteAPI.getNoteWithDescription(settings.detailsNoteKey);
          if (note !== null && note !== undefined) {
            uiApi.openDetailNote(note);
          }
        }
        await reindexIfNeeded();
      },
      addNote: async (key: string): Promise<NoteDTO | undefined> => {
        if (treeComponentRef.current === null) {
          return undefined;
        }

        let parentKey: string | undefined = key;

        if (key === 'ON_ACTIVE_TREE_NODE') {
          parentKey = treeComponentRef.current.getActiveNodeKey();
          console.log("addNote parentKey=", parentKey);
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
        await uiApi.openDetailNote(newNote);
        await detailsNoteComponentRef.current.setFocus();
        return newNote;
      },
      createLinkNote: async (key: string, parentKey: string) => {
        appLog.debug(`createLinkNote key=${key} parentKey=${parentKey}`);

        const note: NoteDTO | undefined =
          await nowNoteAPI.getNoteWithDescription(key, true);

        if (note === undefined) {
          return;
        }

        const newNote: NoteDTO | undefined = await nowNoteAPI.addNote(
          parentKey,
          {
            title:
              note.titlePath !== undefined
                ? note.titlePath
                    .substring(2, note.titlePath.length - 2)
                    .replaceAll('/', ' > ')
                : '',
            type: 'note',
            description: `<p><span class="mention" data-index="0" data-denotation-char="/" data-id="${note.key}"></span></p>`,
          },
          'firstChild'
        );
        await nowNoteAPI.addCreatedLinkIn(parentKey);
        if (treeComponentRef.current === null || newNote === undefined) {
          return;
        }
        await treeComponentRef.current.addNode(newNote);
        await uiApi.focusNodeInTree(newNote.key);
        await uiApi.openDetailNote(newNote.key);
      },
      deleteNote: async (key: string) => {
        if (treeComponentRef.current === null) {
          return false;
        }
        let note = await nowNoteAPI.getNoteWithDescription(key);
        if (note === undefined) {
          return false;
        }
        console.log('Confirmed delete modalDeleteConfirm');
        const confirmed = await modalDeleteConfirm.confirm({
          title: 'Delete?',
        });
        if (!confirmed) {
          return false;
        }
        console.log('Confirmed delete: ', confirmed);

        if (note.trash) {
          await nowNoteAPI.deletePermanently(key);
        } else {
          await nowNoteAPI.moveNoteToTrash(key);
        }
        treeComponentRef.current.removeNode(key);
        note = await nowNoteAPI.getNoteWithDescription(key);
        await uiApi.openDetailNote(note);
        return true;
      },
      restoreNote: async (key: string) => {
        if (treeComponentRef.current === null) {
          return false;
        }
        await nowNoteAPI.restore(key);
        treeComponentRef.current.removeNode(key);
        const note = await nowNoteAPI.getNoteWithDescription(key);
        if (note !== undefined) {
          await uiApi.openDetailNote(note);
          if (note.key !== undefined && note.key !== null) {
            await treeComponentRef.current.reloadNode(note.parent);
          }
        }
        return true;
      },
      openDetailNote: async (
        noteOrKey: NoteDTO | string | undefined,
        ignoreHistory?: boolean
      ) => {
        let note: NoteDTO | undefined;
        /*if (
          noteOrKey === null ||
          noteOrKey === undefined
          // && noteOrKey === detailsNoteKey
        ) {
          return;
        }*/
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
          if (ignoreHistory === undefined || !ignoreHistory) {
            nowNoteAPI.addOpenHistory(note.key);
            // setOpenHistoryId(undefined);
          }
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
        console.log(`treeComponentRef.current`, treeComponentRef.current);
        console.log(`updateNodeInTree call treeComponentRef.current.updateNode`);
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
        if (moveToModalComponentRef.current === null) {
          return;
        }
        moveToModalComponentRef.current.open(key);
      },
      openCreateLinkDialog: async (key: string) => {
        if (createLinkModalComponentRef.current === null) {
          return;
        }
        createLinkModalComponentRef.current.open(key);
      },
      moveNote: async (
        key: string,
        moveToKeyParam: string,
        hitModeParam?: HitMode
      ) => {
        appLog.debug(
          `moveNote key=${key} moveToKeyParam=${moveToKeyParam} hitModeParam=${hitModeParam}`
        );
        let to: string | undefined = moveToKeyParam;
        let hitMode = hitModeParam;
        if (hitMode === undefined) {
          hitMode = 'over';
        }
        if (hitMode === 'firstChild') {
          const children: NoteDTO[] | undefined = await nowNoteAPI.getChildren(
            to,
            false,
            1
          );
          console.log(`moveNote children=`, children);
          if (children !== undefined && children.length === 0) {
            hitMode = 'over';
          } else if (children !== undefined && children.length > 0) {
            to = children[0].key !== null ? children[0].key : undefined;
            hitMode = 'before';
          }
        }
        if (hitMode === 'down') {
          const nextNote: NoteDTO | undefined | null = await nowNoteAPI.getNext(
            key
          );
          if (nextNote === undefined || nextNote === null) {
            return;
          }
          to = nextNote.key !== null ? nextNote.key : undefined;
          hitMode = 'after';
        }
        if (hitMode === 'up') {
          const previousNote: NoteDTO | undefined | null =
            await nowNoteAPI.getPrevious(key);
          if (previousNote === undefined || previousNote === null) {
            return;
          }
          to = previousNote.key !== null ? previousNote.key : undefined;
          hitMode = 'before';
        }

        await nowNoteAPI.moveNote(key, to, hitMode);
        if (treeComponentRef.current !== null) {
          await treeComponentRef.current.move(key, to, hitMode);
        }
        await uiApi.openDetailNote(key);
      },
      openDetailsPrevious: async (
        openHistoryId: number | undefined
      ): Promise<number | undefined> => {
        console.log(`App.openDetailsPrevious() openHistoryId=`, openHistoryId);
        const previousNote: OpenHistoryDTO | undefined =
          await nowNoteAPI.getOpenHistoryPrevious(openHistoryId);
        console.log(`App.openDetailsPrevious() previousNote=`, previousNote);
        if (
          previousNote === undefined ||
          previousNote.key === null ||
          previousNote.key === undefined ||
          previousNote.id === null ||
          previousNote.id === undefined
        ) {
          return undefined;
        }
        // setOpenHistoryId(previousNote.id);
        await uiApi.openDetailNote(previousNote.key, true);
        return previousNote.id;
      },
      openDetailsNext: async (
        openHistoryId: number | undefined
      ): Promise<number | undefined> => {
        console.log(`App.openDetailsNext() openHistoryId=`, openHistoryId);
        const nextNote: OpenHistoryDTO | undefined =
          await nowNoteAPI.getOpenHistoryNext(openHistoryId);
        console.log(`App.openDetailsNext() nextNote=`, nextNote);
        if (
          nextNote === undefined ||
          nextNote.key === null ||
          nextNote.key === undefined ||
          nextNote.id === null ||
          nextNote.id === undefined
        ) {
          return undefined;
        }
        // setOpenHistoryId(nextNote.id);
        await uiApi.openDetailNote(nextNote.key, true);
        return nextNote.id;
      },
      search: async (key: string | undefined): Promise<undefined> => {
        setSearchInNoteKey(key);
        setSearch(true);
        setTrash(false);
      },
    };
  }, [
    detailsNoteUpdateBacklinks,
    detailsNoteUpdateNote,
    detailsNoteUpdateNoteProperties,
    modalDeleteConfirm,
    reindexIfNeeded,
    setCurrentRepository,
    setSearch,
    setTrash,
    trash,
  ]);

  // **********************************************************************************

  const fetchCurrentRepository = useCallback(async () => {
    const userSettingsRepository = await nowNoteAPI.getCurrentRepository();
    if (userSettingsRepository !== undefined) {
      uiApi.setRepository(userSettingsRepository);
    }
  }, [uiApi]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

  useEffect(() => {
    const handelKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyK' && event.ctrlKey) {
        let activeNodeKey: string | undefined;
        if (
          treeComponentRef !== undefined &&
          treeComponentRef.current !== null
        ) {
          activeNodeKey = treeComponentRef.current.getActiveNodeKey();
        }
        uiApi.search(activeNodeKey);
      }
    };
    document.addEventListener('keydown', handelKeyDown);
    return function cleanupListener() {
      window.removeEventListener('keydown', handelKeyDown);
    };
  }, [uiApi]);

  appLog.debug(`currentRepository=${currentRepository} trash=${trash}`);

  const selectRepositoryComponent =
    currentRepository === undefined ? (
      <SelectRepository setRepository={uiApi.setRepository} />
    ) : null;

  let mainComponent = null;

  const openTree = useCallback(() => {
    setSearch(false);
    setTrash(false);
  }, [setSearch, setTrash]);

  if (currentRepository !== undefined && reindexingProgress === 100) {
    mainComponent = (
      <ReflexContainer orientation="horizontal" windowResizeAware>
        {/**<ReflexElement
          size={40}
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 5,
              backgroundColor: '#eeeeee',
              borderBottom: '1px solid #dddddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

            }}
          >
            <Space
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              <NextPrevButtonsComponent
                handlePrev={uiApi.openDetailsPrevious}
                handleNext={uiApi.openDetailsNext}
              />
              <AdvancedSearchButtonComponent
                onClick={() => {
                  // uiApi.openSearchDialog(undefined);
                  openSearch();
                }}
              />
            </Space>
          </div>
              </ReflexElement>**/}
        <ReflexElement>
          <ReflexContainer orientation="vertical">
            <ReflexElement className="left-bar" minSize={200} flex={0.25}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    padding: 3,
                    backgroundColor: '#eeeeee',
                    borderBottom: '1px solid #dddddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Space
                    style={{
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Button
                      size="small"
                      icon={<FolderOutlined />}
                      onClick={openTree}
                    />
                    <AdvancedSearchButtonComponent
                      onClick={() => {
                        let activeNodeKey: string | undefined;
                        if (
                          treeComponentRef !== undefined &&
                          treeComponentRef.current !== null
                        ) {
                          activeNodeKey =
                            treeComponentRef.current.getActiveNodeKey();
                        }
                        uiApi.search(activeNodeKey);
                      }}
                    />
                    <TrashButtonComponent />
                  </Space>
                </div>
                {!search && !trash && <AddNoteButtonComponent />}
                {!search && (
                  <>
                    <RepositoryTitleComponent
                      reindexRepository={reindexRepository}
                    />
                    <NotesTreeComponent ref={treeComponentRef} />
                  </>
                )}
                {search && (
                  <SearchPanelComponent
                    handleOn={(key: string) => {
                      uiApi.openDetailNote(key);
                    }}
                    searchInNoteKey={searchInNoteKey}
                  />
                )}
              </div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement className="right-bar" minSize={200} flex={0.75}>
              <div
                style={{
                  padding: 5,
                  backgroundColor: '#eeeeee',
                  borderBottom: '1px solid #dddddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                }}
              >
                <Space
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                >
                  <NextPrevButtonsComponent
                    handlePrev={uiApi.openDetailsPrevious}
                    handleNext={uiApi.openDetailsNext}
                  />
                </Space>
              </div>
              <Tabs
                defaultActiveKey="1"
                type="card"
                size="small"
                items={new Array(1).fill(null).map((_, i) => {
                  const id = String(i + 1);
                  return {
                    label: `Card Tab ${id}`,
                    key: id,
                    children: <DetailsNoteComponent ref={detailsNoteComponentRef} />,
                  };
                })}
              />
            </ReflexElement>
          </ReflexContainer>
        </ReflexElement>
        {/**<ReflexElement size={35}>
          <Footer reindexRepository={reindexRepository} />
                </ReflexElement>**/}
      </ReflexContainer>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      <UIApiDispatch.Provider value={uiApi}>
        {reindexingProgressComponent}
        {selectRepositoryComponent}
        {mainComponent}
        <MoveToModalComponent
          ref={moveToModalComponentRef}
          trash={trash}
          handleOn={uiApi.moveNote}
        />
        <CreateLinkModalComponent
          ref={createLinkModalComponentRef}
          trash={trash}
          handleOn={uiApi.createLinkNote}
        />
        {contextHolderDeleteConfirm}
      </UIApiDispatch.Provider>
    </ConfigProvider>
  );
}
