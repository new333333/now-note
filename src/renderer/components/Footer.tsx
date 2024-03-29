import log from 'electron-log';
import { useState, useCallback } from 'react';
import { Typography, Tooltip, Button } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

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
      <Tooltip title="Choose other Repository">
        <Button size="small" type="link" onClick={changeRepository}>
          <strong style={{ paddingRight: 3 }}>Repository:</strong>
          {currentRepository && currentRepository.path}
          {!currentRepository && <>No repository initialized</>}
        </Button>
      </Tooltip>&nbsp;
      <Button size="small" onClick={reindexHandler} loading={loading}>
        Reindex Repository
      </Button>
    </div>
  );
}
