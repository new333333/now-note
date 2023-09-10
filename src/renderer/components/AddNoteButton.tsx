import log from 'electron-log';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import useNoteStore from 'renderer/NoteStore';

export default function AddNoteButton() {
  const [trash, addTreeNoteOnNoteKey, setAddTreeNoteOnNoteKey] = useNoteStore(
    (state) => [
      state.trash,
      state.addTreeNoteOnNoteKey,
      state.setAddTreeNoteOnNoteKey,
    ]);

  return (
    <div className={`nn-header ${trash ? 'nn-trash-background-color' : ''}`}>
      <Space>
        {
          !trash &&
          <Button
            size="small"
            loading={addTreeNoteOnNoteKey !== undefined}
            onClick={() => setAddTreeNoteOnNoteKey('ACTIVE_TREE_NODE')}
          >
            <PlusOutlined /> Add
          </Button>
        }
      </Space>
    </div>
  );
}
