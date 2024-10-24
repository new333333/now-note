import log from 'electron-log';
import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
  useCallback,
  memo,
  RefObject,
  useRef,
  useMemo,
  useContext,
} from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  Form,
  InputNumber,
  Input,
  List,
  Select,
  Space,
  Spin,
  Divider,
  Skeleton,
  Collapse,
  Flex,
  Row,
  Col,
  Button,
  Tooltip,
  Typography,
  Dropdown,
  MenuProps,
} from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { NoteDTO, SearchResultOptions } from 'types';
import noteTypes from 'renderer/NoteTypes';
import UIApiDispatch from 'renderer/UIApiDispatch';
import { useDebouncedCallback } from 'use-debounce';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';
import SearchTagsComponent from './search/SearchTagsComponent';
import { ApartmentOutlined, DownOutlined, FilterOutlined, InfoCircleOutlined, RightOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import FancyTreeComponent, { FancyTreeDataProvider } from './FancyTreeComponent';

const { Search } = Input;

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  handleOn: Function;
  // eslint-disable-next-line react/no-unused-prop-types
  searchInNoteKey: string | undefined;
  // eslint-disable-next-line react/no-unused-prop-types
  ref: RefObject<MoveToModalComponentAPI>;
}

class NotesDataProvider extends FancyTreeDataProvider {
  private tree;

  constructor(resultListNotes: NoteDTO[], displayAsTree: boolean) {
    super();
    console.log("NotesDataProvider CONSTRUCTOR >>>>>>>>>>>>> resultListNotes=, displayAsTree=", resultListNotes, displayAsTree);
    if (displayAsTree) {
      const resultListAsAllNodesList = resultListNotes.reduce(
        (nodes, note: NoteDTO) => {
          const keys = note.keyPath
            .substring(2, note.keyPath.length - 2)
            .split('/');
          const titles = note.titlePath
            .substring(2, note.titlePath.length - 2)
            .split('/');

          for (let i = 0; i < keys.length; i += 1) {
            const existierteNode: any = nodes.find(
              (node: NoteDTO) => node.key === keys[i]
            );
            console.log("NotesDataProvider, existierteNode=", existierteNode);
            if (existierteNode === undefined) {
              const newNote = {
                parentKey: i > 0 ? keys[i - 1] : undefined,
                key: keys[i],
                title: titles[i],
                searchResult: i === keys.length - 1,
                type: i === keys.length - 1 ? note.type : 'note',
                expanded: true,
                done: i === keys.length - 1 ? note.done : false,
                trash: note.trash,
              };
              console.log("NotesDataProvider, push new note newNote=", newNote);
              nodes.push(newNote);
            } else {
              existierteNode.searchResult =
                existierteNode.searchResult || i === keys.length - 1;
              if (i === keys.length - 1) {
                existierteNode.type = note.type;
                existierteNode.done = note.done;
                existierteNode.trash = note.trash;
              }
            }
          }
          return nodes;
        },
        []
      );

      const createDataTree = dataset => {
        const hashTable = Object.create(null);
        dataset.forEach(aData => hashTable[aData.key] = {...aData, childNodes: []});
        const dataTree = [];
        dataset.forEach(aData => {
          if (aData.parentKey) {
            hashTable[aData.parentKey].childNodes.push(aData);
          }
        });
        return hashTable;
      };

      this.tree = createDataTree(resultListAsAllNodesList);
    } else {
      this.tree = resultListNotes;
    }
    console.log("NotesDataProvider CONSTRUCTOR >>>>>>>>>>>>> this.tree=", this.tree);
  }

  async getRootNotes(): Promise<NoteDTO[] | undefined> {
    console.log("NotesDataProvider >>> getRootNotes tree=", this.tree);

    const parentNotes = Object.keys(this.tree).filter((key) => this.tree[key].parentKey === undefined).map((key) => this.tree[key]);
    return parentNotes;
  }

  async getChildrenNotes(parentKey: string): Promise<NoteDTO[] | undefined> {
    // console.log("NotesDataProvider >>> getChildrenNotestree=", this.tree);

    const notes = Object.keys(this.tree).filter((key) => this.tree[key].parentKey === parentKey).map((key) => this.tree[key]);
    return notes;
  }

  async getNoteWithDescription(
    key: string,
    withDescription: boolean
  ): Promise<NoteDTO | undefined> {
    return undefined;
  }
}

const noteTypesCheckboxInfo = noteTypes.map((noteType) => {
  return {
    value: noteType.key,
    label: noteType.label,
  };
});

const SearchPanelComponent: React.FC<Props> = memo(
  forwardRef(({ handleOn, searchInNoteKey }: Props, ref) => {
    const domRef = useRef(null);

    const uiApi = useContext(UIApiDispatch);

    const [trash, setTrash] = useState<boolean>(false);
    const [history, setHistory] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(true);
    const [notDone, setNotDone] = useState<boolean>(true);
    const [searchInNote, setSearchInNote] = useState<NoteDTO | undefined>(
      undefined
    );
    const [term, setTerm] = useState<string>('');
    const [selectedNoteTypes, setSelectedNoteTypes] = useState<string[]>(
      noteTypes.map((noteType) => noteType.key)
    );
    const [prioritySign, setPrioritySign] = useState<string>('none');
    const [priority, setPriority] = useState<number>(0);
    const [tags, setTags] = useState<string[]>([]);

    const [resultList, setResultList] = useState<NoteDTO[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [offset, setOffset] = useState<number>(0);
    const [maxResults, setMaxResults] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilter, setShowFilter] = useState(false);
    const [displayAsTree, setDisplayAsTree] = useState(true);
    const [sortBy, setSortyBy] = useState('rank');

    const SEARCH_RESULTS = 500;

    useEffect(() => {
      const fetchResultList = async () => {
        console.log('start fetchResultList searchInNote', searchInNote);
        const parentNotesKey: string[] = [];
        if (
          searchInNote !== undefined &&
          searchInNote.key !== undefined &&
          searchInNote.key !== null
        ) {
          parentNotesKey.push(searchInNote.key);
        }
        console.log(`parentNotesKey=`, parentNotesKey);
        const dones = [];
        if (done) {
          dones.push(1);
        }
        if (notDone) {
          dones.push(0);
        }
        const searchResultOptions: SearchResultOptions = {
          parentNotesKey,
          types: selectedNoteTypes,
          dones,
          sortBy,
          offset,
          prioritySign,
          priority,
          tags,
        };
        console.log(`term=`, term);
        console.log(`SEARCH_RESULTS=`, SEARCH_RESULTS);
        console.log(`trash=`, trash);
        console.log(`dones=`, dones);
        console.log(`history=`, history);
        console.log(`searchResultOptions=`, searchResultOptions);
        const searchResult = await nowNoteAPI.search(
          term,
          SEARCH_RESULTS,
          trash,
          searchResultOptions
        );
        console.log(`searchResult=`, searchResult);
        // setOffset(offset + SEARCH_RESULTS);
        setHasMore(
          searchResult.maxResults >
            resultList.length + searchResult.results.length
        );
        setMaxResults(searchResult.maxResults);
        setResultList([...resultList, ...searchResult.results]); // predervs last results (get more....)
        setIsLoading(false);
      };

      fetchResultList();
      return () => {
        setIsLoading(true);
      };
    }, [
      searchInNote,
      offset,
      term,
      selectedNoteTypes,
      prioritySign,
      priority,
      tags,
      trash,
      sortBy,
      done,
      notDone,
      history,
      // resultList,
    ]);

    const handleChangeSearchInNote = useCallback(
      async (noteKey: string | undefined) => {
        console.log(`SearchPanelComponent.handleChangeSearchInNote noteKey=, searchInNote=`, noteKey, searchInNote);

        if (
          (searchInNote !== undefined && searchInNote.key === noteKey) ||
          (searchInNote === undefined &&
            (noteKey === undefined ||
              noteKey?.toLowerCase().startsWith('root')))
        ) {
          return;
        }

        if (noteKey !== undefined && noteKey !== null && noteKey !== 'ROOT') {
          const note: NoteDTO | undefined =
            await nowNoteAPI.getNoteWithDescription(noteKey, true);
          if (note !== undefined) {
            console.log(`SearchPanelComponent.setSearchInNote note=`, note);
            setOffset(0);
            setHasMore(false);
            setResultList([]);
            setSearchInNote(note);
            // fetchResultList();
          } else {
            console.log(`SearchPanelComponent.setSearchInNote note=undefined`);
            setOffset(0);
            setHasMore(false);
            setResultList([]);
            setSearchInNote(undefined);
            // fetchResultList();
          }
        } else {
          console.log(`SearchPanelComponent.setSearchInNote note=undefined`);
          setOffset(0);
          setHasMore(false);
          setResultList([]);
          setSearchInNote(undefined);
          // fetchResultList();
        }
      },
      [searchInNote]
    );

    useEffect(() => {
      if (
        searchInNoteKey !== undefined &&
        searchInNoteKey !== null &&
        !searchInNoteKey.startsWith('root_')
      ) {
        handleChangeSearchInNote(searchInNoteKey);
      }
      // do not put handleChangeSearchInNote in dependencies, do only on init, do not rerun after that
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOnSearch = useCallback(
      async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target !== undefined) {
          console.log(`handleOnSearch event.target.value=`, event.target.value);
          setTerm(event.target.value);
        }

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        // fetchResultList();
      },
      []
    );

    const handleOnChangeType = useCallback(
      async (newSelectedNoteType: CheckboxValueType[]) => {
        setSelectedNoteTypes(newSelectedNoteType);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        // fetchResultList();
      },
      []
    );

    const handleOnChangePrioritySign = useCallback(
      async (newPrioritySign: string) => {
        setPrioritySign(newPrioritySign);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        // fetchResultList();
      },
      []
    );

    const handleOnChangePriority = useCallback(
      (newPriority: number | null) => {
        setPriority(newPriority);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        // fetchResultList();
      },
      []
    );

    const handleOnChangeTags = useCallback((newTags: string[]) => {
      setTags(newTags);
      setOffset(0);
      setHasMore(false);
      setResultList([]);
    }, []);

    const handleOnChangeTrash = useCallback((newTrash: CheckboxChangeEvent) => {
      setTrash(newTrash.target.checked);
      setOffset(0);
      setHasMore(false);
      setResultList([]);
    }, []);

    const handleOnChangeDone = useCallback((newDone: CheckboxChangeEvent) => {
      setDone(newDone.target.checked);
      setOffset(0);
      setHasMore(false);
      setResultList([]);
    }, []);

    const handleOnChangeNotDone = useCallback(
      (newDone: CheckboxChangeEvent) => {
        setNotDone(newDone.target.checked);
        setOffset(0);
        setHasMore(false);
        setResultList([]);
      },
      []
    );

    const handleOnChangeHistory = useCallback(
      (newHistory: CheckboxChangeEvent) => {
        setHistory(newHistory.target.checked);
        setOffset(0);
        setHasMore(false);
        setResultList([]);
      },
      []
    );

    const handleOnChangeShowFilter = useCallback(() => {
      setShowFilter((prevCheck) => !prevCheck);
    }, []);

    const handleOnChangesetDisplayAsTree = useCallback(() => {
      setDisplayAsTree((prevCheck) => !prevCheck);
    }, []);

    const searchInKeyPath =
      searchInNote !== undefined &&
      searchInNote.keyPath !== undefined &&
      searchInNote.titlePath !== undefined
        ? `$/ROOT/${searchInNote.keyPath.substring(
            2,
            searchInNote.keyPath.length
          )}`
        : `$/ROOT/^`;

    const searchInTitlePath =
      searchInNote !== undefined &&
      searchInNote.keyPath !== undefined &&
      searchInNote.titlePath !== undefined
        ? `$/All/${searchInNote.titlePath.substring(
            2,
            searchInNote.titlePath.length
          )}`
        : `$/All/^`;

    const heightScroll: number = 300;

    const notesDataProvider: FancyTreeDataProvider = useMemo(() => {
      return new NotesDataProvider(resultList, displayAsTree);
    }, [resultList, displayAsTree]);

    const handleOnClick = useCallback(
      (key: string): void => {
        const { openDetailNote } = uiApi;
        openDetailNote(key);
      },
      [uiApi]
    );

    const handleChangeDone = useCallback(
      async (key: string, done: boolean) => {
        console.log(`handleChangeDone key=${key}, done=${done}`);
        if (uiApi === null) {
          return;
        }
        console.log(`handleChangeDone key=${key}, done=${done}`);
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          done,
        });
        const { updateDetailNote } = uiApi;
        updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    const handleOnLoadMore = useDebouncedCallback(() => {
      setOffset((prev) => prev + SEARCH_RESULTS);
    }, 100);

    const sortyByMenuItems: MenuProps['items'] = [
      {
        key: 'rank',
        label: `Relevance`,
      },
      {
        key: 'priority',
        label: `Priority`,
      },
      {
        key: 'createdat',
        label: `Created on`,
      },
      {
        key: 'updatedat',
        label: `Modified on`,
      },
      {
        key: 'az',
        label: `A-Z`,
      },
      {
        key: 'za',
        label: `Z-A`,
      },
    ];

    const handleOnChangeSortBy: MenuProps['onClick'] = ({ key }) => {
      console.log("handleOnChangeSortBy key=, sortBy=", key, sortBy);
      if (key === sortBy) {
        return;
      }
      setSortyBy(key);
      setOffset(0);
      setHasMore(false);
      setResultList([]);
    };

    const handleSaveQuery = useCallback(async () => {}, []);

    const contextMenu = {
      zIndex: 100,

      menu: (node: FancytreeNode) => {
        console.log('Tree contextMenu node=', node);
        const menu: any = {};
        menu.open = { name: 'Open' };
        return menu;
      },
      actions: async (
        node: FancytreeNode,
        action: string,
        options: any
      ) => {
        console.log(`actions action=`, action);
        const {
          openDetailNote,
          deleteNote,
          addNote,
          openMoveToDialog,
          openCreateLinkDialog,
          restoreNote,
          moveNote,
        } = uiApi;

        if (action === 'open') {
          await openDetailNote(node.key);
        }
      },
    },

    return (
      <>
        <NoteBreadCrumbComponent
          keyPath={searchInKeyPath}
          titlePath={searchInTitlePath}
          handleOnClick={handleChangeSearchInNote}
        />
        <div>
          <Button
            type='link'
            size="small"
            onClick={handleSaveQuery}
          >Save query</Button>
        </div>
        <div>
          <Input
            style={{ width: 'calc(100% - 50px)' }}
            placeholder="input search text"
            onChange={handleOnSearch}
            size="small"
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
          />
          <Button
            size="small"
            icon={<FilterOutlined style={{color: showFilter ? "black" : "rgba(0,0,0,.45)"}} />}
            onClick={handleOnChangeShowFilter}
          />
          <Button
            size="small"
            icon={<ApartmentOutlined  style={{ color: displayAsTree ? "black" : "rgba(0,0,0,.45)" }} />}
            onClick={handleOnChangesetDisplayAsTree}
          />
        </div>
        <div>
          <Typography>
            {(offset + SEARCH_RESULTS) < maxResults ? (offset + SEARCH_RESULTS) : maxResults} von {maxResults}
            <Button
              type="link"
              size="small" onClick={handleOnLoadMore} disabled={!hasMore || isLoading}>Load more...</Button>
          </Typography>
        </div>
        <div>
          {!displayAsTree && (
            <Dropdown menu={{ items: sortyByMenuItems, onClick: handleOnChangeSortBy }}>
              <Space>
                Sort by {sortBy}
                <DownOutlined />
              </Space>
            </Dropdown>
          )}
        </div>
        {isLoading && <div>Loading...</div>}
        {showFilter && (
          <div className="n3-tree-node-filter">
            <div>
              <Checkbox.Group
                options={noteTypesCheckboxInfo}
                defaultValue={selectedNoteTypes}
                onChange={handleOnChangeType}
              />
            </div>
            <div>
              Priority
              <Select
                size="small"
                value={prioritySign}
                onChange={handleOnChangePrioritySign}
                options={[
                  { value: 'none', label: 'ignore' },
                  { value: 'equal', label: '=' },
                  { value: 'lt', label: '<' },
                  { value: 'ltequal', label: '<=' },
                  { value: 'gt', label: '>' },
                  { value: 'gtequal', label: '>=' },
                ]}
              />
              {prioritySign !== 'none' && (
                <InputNumber
                  min={0}
                  size="small"
                  value={priority}
                  onChange={handleOnChangePriority}
                  width={20}
                />
              )}
            </div>
            <div>
              <SearchTagsComponent
                tags={tags}
                handleAddTag={(tag: string) => {
                  handleOnChangeTags([...tags, tag]);
                }}
                handleRemoveTag={(tag: string) => {
                  handleOnChangeTags(tags.filter((a) => a !== tag));
                }}
              />
            </div>
            <div>
              <Checkbox checked={trash} onChange={handleOnChangeTrash}>
                Trash
              </Checkbox>
            </div>
            <div>
              <Checkbox checked={history} onChange={handleOnChangeHistory}>History</Checkbox>
            </div>
            <div>
              <Checkbox checked={done} onChange={handleOnChangeDone}>Done tasks</Checkbox>
              <Checkbox checked={notDone} onChange={handleOnChangeNotDone}>Undone tasks</Checkbox>
            </div>
          </div>
        )}
        <FancyTreeComponent
          readOnly
          onClick={handleOnClick}
          onSelect={handleChangeDone}
          onChangeTitle={() => {}}
          onExpand={() => {}}
          dataProvider={notesDataProvider}
          contextMenu={contextMenu}
          ref={domRef}
        />
      </>
    );
  })
);

SearchPanelComponent.propTypes = {
  handleOn: PropTypes.func.isRequired,
};

export default SearchPanelComponent;
