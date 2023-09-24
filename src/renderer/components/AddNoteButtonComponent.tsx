import log from 'electron-log';
import { useContext, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import UIApiDispatch from 'renderer/UIApiDispatch';

const AAddNoteButtonComponentLog = log.scope('AddNoteButtonComponent');

export default function AddNoteButtonComponent() {
  AAddNoteButtonComponentLog.debug(`render`);

  const [trash] = useNoteStore((state) => [state.trash]);
  const [loading, setLoading] = useState(false);

  let button = null;

  const uiApi = useContext(UIApiDispatch);

  const handleClick = async () => {
    setLoading(true);
    const { addNote } = uiApi;
    await addNote('ON_ACTIVE_TREE_NODE');
    setLoading(false);
  };

  if (!trash) {
    button = (
      <Button size="small" loading={loading} onClick={handleClick}>
        <PlusOutlined /> Add
      </Button>
    );
  }

  return (
    <div className={`nn-header ${trash ? 'nn-trash-background-color' : ''}`}>
      <Space>{button}</Space>
    </div>
  );
}
