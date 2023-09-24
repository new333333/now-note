import log from 'electron-log';
import { useState, useCallback } from 'react';
import { Typography, Tooltip, Button } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const { Link } = Typography;

export default function Footer() {
  const [currentRepository, setCurrentRepository] = useNoteStore((state) => [
    state.currentRepository,
    state.setCurrentRepository,
  ]);
  const [loading, setLoading] = useState(false);

  const changeRepository = useCallback(() => {
    setCurrentRepository(undefined);
  }, [setCurrentRepository]);

  const reindexAllHandler = useCallback(async () => {
    log.debug('AddNoteButton.reindexAllHandler call');
    setLoading(true);
    await nowNoteAPI.reindexAll(undefined);
    setLoading(false);
  }, []);

  return (
    <div
      style={{
        padding: 5,
        backgroundColor: '#eeeeee',
        borderTop: '1px solid #dddddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Tooltip title="Choose other Repository">
        <Link onClick={changeRepository}>
          <strong>Repository:</strong> {currentRepository && currentRepository.path}
          {!currentRepository && <>No repository initialized</>}
        </Link>
      </Tooltip>&nbsp;
      <Button size="small" onClick={reindexAllHandler} loading={loading}>
        Reindex Repository
      </Button>
    </div>
  );
}
