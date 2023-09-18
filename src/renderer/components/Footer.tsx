import log from 'electron-log';
import { useContext, useCallback } from 'react';
import { Typography, Tooltip, Button } from 'antd';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const { Link } = Typography;

export default function Footer() {
  const [currentRepository, setCurrentRepository] = useNoteStore((state) => [
    state.currentRepository,
    state.setCurrentRepository,
  ]);

  const changeRepository = useCallback(() => {
    setCurrentRepository(undefined);
  }, [setCurrentRepository]);

  const reindexAllHandler = useCallback(() => {
    log.debug('AddNoteButton.reindexAllHandler call');
    nowNoteAPI.reindexAll(undefined);
  }, []);

  return (
    <div id="nn-footer">
      <Tooltip title="Choose other Repository">
        <Link onClick={changeRepository}>
          <strong>Repository:</strong> {currentRepository && currentRepository.path}
          {!currentRepository && <>No repository initialized</>}
        </Link>
      </Tooltip>&nbsp;
      <Button size="small" onClick={reindexAllHandler}>
        Reindex Repository
      </Button>
    </div>
  );
}
