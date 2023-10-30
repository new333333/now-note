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
import { Button, Divider, List, Modal } from 'antd';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { MoveToDTO, MoveToModalComponentAPI, NoteDTO } from 'types';
import { DeleteOutlined } from '@ant-design/icons';
import SimpleSearchNotesComponent from './SimpleSearchNotesComponent';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  trash: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  handleOn: Function;
  // eslint-disable-next-line react/no-unused-prop-types
  ref: RefObject<MoveToModalComponentAPI>;
}

interface MoveToListElement {
  moveTo: MoveToDTO;
  note: NoteDTO;
}

const SearchModalComponent: React.FC<Props> = memo(
  forwardRef(({ trash, handleOn }: Props, ref) => {
    const [isModalMoveToOpen, setIsModalMoveToOpen] = useState(false);
    const [searchInNote, setSearchInNote] = useState<NoteDTO | undefined>(
      undefined
    );

    const [key, setKey] = useState<string | undefined>(undefined);
    const [parent, setParent] = useState<string | undefined>(undefined);
    const [moveToList, setMoveToList] = useState<MoveToListElement[]>([]);

    const showModal = async (noteKey: string) => {
      console.log(`SearchModalComponent.showModal noteKey=`, noteKey);
      if (noteKey !== undefined && noteKey !== null) {
        const note = await nowNoteAPI.getNoteWithDescription(noteKey, true);
        if (note !== undefined) {
          setSearchInNote(note);
          setParent(note.parent !== null ? note.parent : undefined);
        }
      }
      setKey(noteKey);
      setIsModalMoveToOpen(true);
    };

    const handleOk = (moveToKey: string) => {
      setIsModalMoveToOpen(false);
      handleOn(key, moveToKey === 'ROOT' ? undefined : moveToKey);
      setKey(undefined);
      setParent(undefined);
    };

    const handleCancel = () => {
      setIsModalMoveToOpen(false);
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          open: async (noteKey: string) => {
            showModal(noteKey);
          },
        };
      },
      []
    );

    const fetchMoveToList = useCallback(async () => {
      const moveToDTOs: MoveToDTO[] = await nowNoteAPI.getMoveToList();
      if (moveToDTOs === undefined) {
        return;
      }
      const moveToNotes: MoveToListElement[] = [];

      for (let i = 0; i < moveToDTOs.length; i += 1) {
        // eliminate moving note
        if (moveToDTOs[i].key === key) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (moveToDTOs[i].key === null || moveToDTOs[i].key === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const note = await nowNoteAPI.getNoteWithDescription(
          moveToDTOs[i].key,
          true
        );
        if (note === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eliminate children of moved note
        if (
          note.keyPath !== undefined &&
          key !== undefined &&
          note.keyPath?.indexOf(`/${key}/`) > -1
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eliminate current parent
        if (note.key === parent) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (note.trash) {
          // eslint-disable-next-line no-continue
          continue;
        }
        moveToNotes.push({
          note,
          moveTo: moveToDTOs[i],
        });
      }

      // add ROOT
      if (parent !== null) {
        moveToNotes.unshift({
          note: {
            keyPath: '$/ROOT/^',
            titlePath: '$/Root/^',
          },
          moveTo: {
            id: -1,
            key: '-1',
          },
        });
      }

      setMoveToList(moveToNotes);
    }, [key, parent]);

    useEffect(() => {
      fetchMoveToList();
    }, [fetchMoveToList]);

    const removeMoveTo = useCallback(
      async (id: number) => {
        await nowNoteAPI.removeMoveTo(id);
        await fetchMoveToList();
      },
      [fetchMoveToList]
    );

    return (
      <Modal
        title={
          <>
            {searchInNote !== undefined && (
              <>
                Search in
                <NoteBreadCrumbComponent
                  keyPath={searchInNote.keyPath}
                  titlePath={searchInNote.titlePath}
                  handleOnClick={() => {}}
                />
              </>
            )}
            &nbsp;
            <i>
              {searchInNote !== undefined &&
                searchInNote.titlePath !== undefined &&
                searchInNote.titlePath
                  .substring(2, searchInNote.titlePath.length - 2)
                  .replaceAll('/', ' / ')}
            </i>
            &nbsp;:
          </>
        }
        open={isModalMoveToOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <SimpleSearchNotesComponent
          trash={trash}
          onSelect={handleOk}
          excludeParentNotesKeyProp={key !== undefined ? [key] : []}
          excludeNotesKeyProp={parent !== undefined ? [parent] : []}
        />

        {moveToList && moveToList.length > 0 && (
          <>
            <Divider />
            <List
              size="small"
              bordered
              header="Recent used:"
              dataSource={moveToList}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.moveTo.id !== null &&
                      item.moveTo.id !== undefined &&
                      item.moveTo.id !== -1 && (
                        <Button
                          size="small"
                          type="dashed"
                          icon={<DeleteOutlined />}
                          onClick={() => removeMoveTo(item.moveTo.id)}
                        />
                      )
                    }
                    title={
                      <NoteBreadCrumbComponent
                        keyPath={item.note.keyPath}
                        titlePath={item.note.titlePath}
                        handleOnClick={handleOk}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    );
  })
);

SearchModalComponent.propTypes = {
  // trash: PropTypes.bool.isRequired,
  // handleOn: PropTypes.func.isRequired,
};

export default SearchModalComponent;
