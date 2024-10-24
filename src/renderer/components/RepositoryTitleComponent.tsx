import log from 'electron-log';
import { useState, useCallback } from 'react';
import { Typography, Tooltip, Button, Dropdown, MenuProps } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { DownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  reindexRepository: Function;
}

export default function Footer({ reindexRepository }: Props) {
  const [currentRepository, setCurrentRepository] = useNoteStore((state) => [
    state.currentRepository,
    state.setCurrentRepository,
  ]);
  const [loading, setLoading] = useState(false);

  const changeRepository = useCallback(async () => {
    await nowNoteAPI.closeRepository();
    setCurrentRepository(undefined);
  }, [setCurrentRepository]);

  const reindexHandler = useCallback(async () => {
    log.debug('AddNoteButton.reindexHandler call');
    reindexRepository();
  }, [reindexRepository]);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'reindex') {
      reindexHandler();
    } else if (key === 'change') {
      changeRepository();
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'change',
      label: 'Change Repository',
    },
    {
      key: 'reindex',
      label: 'Reindex Repository',
    },
  ];
//  onClick={changeRepository}
  return (
    <div
      style={{
        paddingLeft: 5,
        padding: 5,
        backgroundColor: '#eeeeee',
        borderTop: '1px solid #dddddd',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <Tooltip title={currentRepository.path} placement="left">
        <Dropdown menu={{ items, onClick }} trigger={['contextMenu']}>
          <Button size="small" type="text">
            {currentRepository && currentRepository.name}
            {!currentRepository && <>No repository initialized</>}
          </Button>
        </Dropdown>
      </Tooltip>
    </div>
  );
}
