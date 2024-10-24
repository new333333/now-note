import log from 'electron-log';
import { useContext, useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import UIApiDispatch from 'renderer/UIApiDispatch';

const { Title } = Typography;

const AAddNoteButtonComponentLog = log.scope('AddNoteButtonComponent');

export default function AddNoteButtonComponent() {
  AAddNoteButtonComponentLog.debug(`render`);

  const [trash] = useNoteStore((state) => [state.trash]);
  const [loading, setLoading] = useState(false);

  const uiApi = useContext(UIApiDispatch);

  const handleClick = async () => {
    setLoading(true);
    const { addNote } = uiApi;
    await addNote('ON_ACTIVE_TREE_NODE');
    setLoading(false);
  };

  let button = (
    <Button size="small" loading={loading} onClick={handleClick}>
      <EditOutlined />
    </Button>
  );

  if (trash) {
    button = (
      <Title style={{ margin: 0 }} level={5}>
        Trash
      </Title>
    );
  }

  return (
    <div
      style={{
        padding: 5,
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #dddddd',
        height: 24,
      }}
    >
      <Space>{button}</Space>
    </div>
  );
}
