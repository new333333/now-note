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
import { CreateLinkModalComponentAPI, CreatedLinkInDTO, NoteDTO } from 'types';
import { DeleteOutlined } from '@ant-design/icons';
import SimpleSearchNotesComponent from './SimpleSearchNotesComponent';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  trash: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  handleOn: Function;
  // eslint-disable-next-line react/no-unused-prop-types
  ref: RefObject<CreateLinkModalComponentAPI>;
}

interface MoveToListElement {
  moveTo: CreatedLinkInDTO;
  note: NoteDTO;
}

const CreateLinkModalComponent: React.FC<Props> = memo(
  forwardRef(({ trash, handleOn }: Props, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [key, setKey] = useState<string | undefined>(undefined);
    const [titlePath, setTitlePath] = useState<string | undefined>(undefined);
    const [parent, setParent] = useState<string | undefined>(undefined);
    const [moveToList, setMoveToList] = useState<MoveToListElement[]>([]);

    const showModal = async (noteKey: string) => {
      const note = await nowNoteAPI.getNoteWithDescription(noteKey, true);
      if (note !== undefined) {
        setParent(note.parent !== null ? note.parent : undefined);
        setTitlePath(note.titlePath);
      }
      setKey(noteKey);
      setIsModalOpen(true);
    };

    const handleOk = (moveToKey: string) => {
      setIsModalOpen(false);
      handleOn(key, moveToKey === 'ROOT' ? undefined : moveToKey);
      setKey(undefined);
      setParent(undefined);
    };

    const handleCancel = () => {
      setIsModalOpen(false);
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

    const fetchCreatedLinkInList = useCallback(async () => {
      const createdLinkInDTOs: CreatedLinkInDTO[] = await nowNoteAPI.getCreatedLinkInList();
      if (createdLinkInDTOs === undefined) {
        return;
      }
      const moveToNotes: MoveToListElement[] = [];

      for (let i = 0; i < createdLinkInDTOs.length; i += 1) {
        // eliminate moving note
        if (createdLinkInDTOs[i].key === key) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (createdLinkInDTOs[i].key === null || createdLinkInDTOs[i].key === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const note = await nowNoteAPI.getNoteWithDescription(
          createdLinkInDTOs[i].key,
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
          moveTo: createdLinkInDTOs[i],
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
      fetchCreatedLinkInList();
    }, [fetchCreatedLinkInList]);

    const removeMoveTo = useCallback(
      async (id: number) => {
        await nowNoteAPI.removeMoveTo(id);
        await fetchCreatedLinkInList();
      },
      [fetchCreatedLinkInList]
    );

    return (
      <Modal
        title={
          <>
            Create note with link to the note&nbsp;
            <i>
              {titlePath !== undefined &&
                titlePath
                  .substring(2, titlePath.length - 2)
                  .replaceAll('/', ' / ')}
            </i>
            &nbsp;from:
          </>
        }
        open={isModalOpen}
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
              header="Recent used"
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

CreateLinkModalComponent.propTypes = {
  trash: PropTypes.bool.isRequired,
  handleOn: PropTypes.func.isRequired,
};

export default CreateLinkModalComponent;
