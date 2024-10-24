import log from 'electron-log';
import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
  useCallback,
  memo,
  RefObject,
} from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  Form,
  InputNumber,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Divider,
  Skeleton,
  Collapse,
  Flex,
  Row,
  Col,
} from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { MoveToModalComponentAPI, NoteDTO, SearchResultOptions } from 'types';
import noteTypes from 'renderer/NoteTypes';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';
import SearchTagsComponent from './search/SearchTagsComponent';

const { Search } = Input;

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  handleOn: Function;
  // eslint-disable-next-line react/no-unused-prop-types
  ref: RefObject<MoveToModalComponentAPI>;
}

const noteTypesCheckboxInfo = noteTypes.map((noteType) => {
  return {
    value: noteType.key,
    label: noteType.label,
  };
});

const SearchModalComponent: React.FC<Props> = memo(
  forwardRef(({ handleOn }: Props, ref) => {
    const [isModalMoveToOpen, setIsModalMoveToOpen] = useState(false);

    const [trash, setTrash] = useState<boolean>(false);
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

    const fetchResultList = useCallback(async () => {
      console.log('start fetchResultList');

      const parentNotesKey: string[] = [];
      if (
        searchInNote !== undefined &&
        searchInNote.key !== undefined &&
        searchInNote.key !== null
      ) {
        parentNotesKey.push(searchInNote.key);
      }

      console.log(`parentNotesKey=`, parentNotesKey);

      const searchResultOptions: SearchResultOptions = {
        parentNotesKey,
        types: selectedNoteTypes,
        dones: [],
        sortBy: '',
        offset,
        prioritySign,
        priority,
        tags,
      };

      const searchResult = await nowNoteAPI.search(
        term,
        20,
        trash,
        searchResultOptions
      );

      console.log(`searchResult=`, searchResult);

      setOffset(offset + 20);
      setHasMore(searchResult.maxResults > searchResult.results.length);
      setResultList([...resultList, ...searchResult.results]);
    }, [
      offset,
      priority,
      prioritySign,
      resultList,
      searchInNote,
      selectedNoteTypes,
      tags,
      term,
      trash,
    ]);

    const handleChangeSearchInNote = useCallback(
      async (noteKey: string | undefined) => {
        console.log(`SearchModalComponent.handleChangeSearchInNote noteKey=`, noteKey);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        if (noteKey !== undefined && noteKey !== null && noteKey !== 'ROOT') {
          const note = await nowNoteAPI.getNoteWithDescription(noteKey, true);
          if (note !== undefined) {
            setSearchInNote(note);
            fetchResultList();
          }
        } else if (
          noteKey !== undefined ||
          noteKey !== null ||
          noteKey === 'ROOT'
        ) {
          setSearchInNote(undefined);
          fetchResultList();
        }
      },
      [fetchResultList]
    );

    const showModal = useCallback(
      async (noteKey: string | undefined) => {
        await handleChangeSearchInNote(noteKey);
        setIsModalMoveToOpen(true);
      },
      [handleChangeSearchInNote]
    );

    const handleOk = (moveToKey: string) => {
      setIsModalMoveToOpen(false);
      handleOn(searchInNote?.key, moveToKey === 'ROOT' ? undefined : moveToKey);
      setSearchInNote(undefined);
    };

    const handleCancel = () => {
      setIsModalMoveToOpen(false);
      setResultList([]);
      setHasMore(false);
      setOffset(0);
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          open: async (noteKey: string | undefined, newTrash: boolean) => {
            showModal(noteKey);
            setTrash(newTrash);
          },
        };
      },
      [showModal]
    );

    const handleOnSearch = useCallback(
      async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target !== undefined) {
          console.log(`handleOnSearch event.target.value=`, event.target.value);
          setTerm(event.target.value);
        }

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    const handleOnChangeType = useCallback(
      async (newSelectedNoteType: CheckboxValueType[]) => {
        setSelectedNoteTypes(newSelectedNoteType);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    const handleOnChangePrioritySign = useCallback(
      async (newPrioritySign: string) => {
        setPrioritySign(newPrioritySign);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    const handleOnChangePriority = useCallback(
      (newPriority: number | null) => {
        setPriority(newPriority);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    const handleOnChangeTags = useCallback(
      (newTags: string[]) => {
        setTags(newTags);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    const handleOnChangeTrash = useCallback(
      (newTrash: CheckboxChangeEvent) => {
        setTrash(newTrash.target.checked);

        setOffset(0);
        setHasMore(false);
        setResultList([]);

        fetchResultList();
      },
      [fetchResultList]
    );

    useEffect(() => {
      if (isModalMoveToOpen && offset === 0) {
        fetchResultList();
      }
    }, [fetchResultList, isModalMoveToOpen, offset]);

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

    return (
      <Modal
        width="90%"
        style={{ top: 5 }}
        open={isModalMoveToOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <div  style={{ height: 400, width: '100%', border: '1px solid blue' }}>
          <Row gutter={[8, 8]}>
            <Space direction="horizontal">
              <span>Search in:</span>
              <NoteBreadCrumbComponent
                keyPath={searchInKeyPath}
                titlePath={searchInTitlePath}
                handleOnClick={handleChangeSearchInNote}
              />
            </Space>
          </Row>
          <Row gutter={[8, 8]} style={{
                border: '1px solid green',
                height: '100%',
              }}
              heig>
            <Col span={16}
              style={{
                border: '1px solid red',
                height: '100%',
              }}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Search
                  placeholder="input search text"
                  onChange={handleOnSearch}
                  onSearch={handleOnSearch}
                  enterButton
                />
                <div
                  id="scrollableDiv"
                  className="scrollableDiv"
                  style={{
                    height: heightScroll,
                    overflow: 'auto',
                    border: '1px solid rgba(140, 140, 140, 0.35)',
                  }}
                >
                  <InfiniteScroll
                    dataLength={resultList.length}
                    next={fetchResultList}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    height={heightScroll}
                    loader={<></>}
                  >
                    <List
                      size="small"
                      bordered={false}
                      dataSource={resultList}
                      renderItem={(note: NoteDTO) => (
                        <List.Item>
                          <List.Item.Meta
                            description={
                              <NoteBreadCrumbComponent
                                keyPath={note.keyPath}
                                titlePath={note.titlePath}
                                handleOnClick={handleOn}
                              />
                            }

                          />
                        </List.Item>
                      )}
                    />
                  </InfiniteScroll>
                </div>
              </Space>
            </Col>
            <Col span={8}>
              <Form
                size="small"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 10 }}
              >
                <Form.Item
                  label="Types"
                  style={{
                    marginBottom: 8,
                  }}
                >
                  <Checkbox.Group
                    options={noteTypesCheckboxInfo}
                    defaultValue={selectedNoteTypes}
                    onChange={handleOnChangeType}
                  />
                </Form.Item>
                <Form.Item
                  label="Priority"
                  style={{
                    marginBottom: 8,
                  }}
                >
                  <Space size="small">
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
                  </Space>
                </Form.Item>
                <Form.Item
                  label="Tags"
                  style={{
                    marginBottom: 8,
                  }}
                >
                  <SearchTagsComponent
                    tags={tags}
                    handleAddTag={(tag: string) => {
                      handleOnChangeTags([...tags, tag]);
                    }}
                    handleRemoveTag={(tag: string) => {
                      handleOnChangeTags(tags.filter((a) => a !== tag));
                    }}
                  />
                </Form.Item>
                <Form.Item
                  style={{
                    marginBottom: 8,
                  }}
                >
                  <Checkbox
                    checked={trash}
                    onChange={handleOnChangeTrash}
                  >
                    Trash
                  </Checkbox>
                </Form.Item>
                <Form.Item
                  style={{
                    marginBottom: 8,
                  }}
                >
                  <Checkbox onChange={() => {

                  }}>History</Checkbox>
                </Form.Item>
              </Form>
              order by FIELD asc/desc
          </Col>
          </Row>
        </div>
      </Modal>
    );
  })
);

SearchModalComponent.propTypes = {
  handleOn: PropTypes.func.isRequired,
};

export default SearchModalComponent;
