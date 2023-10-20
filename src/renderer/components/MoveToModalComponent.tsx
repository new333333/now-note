import log from 'electron-log';
import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
  useCallback,
} from 'react';
import { Button, Divider, List, Modal } from 'antd';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { MoveToDTO, NoteDTO } from 'types';
import SearchNotes from './SearchNotes';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';
import { DeleteOutlined } from '@ant-design/icons';

interface Props {
  trash: boolean;
  handleOn: Function;
}

interface MoveToListElement {
  moveTo: MoveToDTO;
  note: NoteDTO;
}

const MoveToModalComponent = React.memo(
  forwardRef(function MoveToModalComponent({ trash, handleOn }: Props, ref) {
    const [isModalMoveToOpen, setIsModalMoveToOpen] = useState(false);
    const [key, setKey] = useState<string | undefined>(undefined);
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [parent, setParent] = useState<string | null>(null);
    const [moveToList, setMoveToList] = useState<MoveToListElement[]>([]);

    const showModal = async (noteKey: string) => {
      const note = await nowNoteAPI.getNoteWithDescription(noteKey, true);
      if (note !== undefined) {
        setParent(note.parent);
        setTitle(note.title);
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
          open: (noteKey: string) => {
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
        if (moveToDTOs[i].key === null || moveToDTOs[i].key === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eliminate moving note
        if (moveToDTOs[i].key === key) {
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
            Move &apos;<i>{title}</i>&apos; to:
          </>
        }
        open={isModalMoveToOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <SearchNotes
          trash={trash}
          onSelect={handleOk}
          excludeParentNotesKeyProp={key !== undefined ? [key] : []}
          excludeNotesKeyProp={parent !== null ? [parent] : []}
        />

        {
          moveToList && moveToList.length > 0 &&
          <>
            <Divider />
            <List
              size="small"
              bordered
              header="Recent moved to:"
              dataSource={moveToList}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.moveTo.id !== -1 &&
                      <Button
                        size="small"
                        type="dashed"
                        icon={<DeleteOutlined />}
                        onClick={() => removeMoveTo(item.moveTo.id)}
                      />
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
        }
      </Modal>
    );
  })
);

export default MoveToModalComponent;
