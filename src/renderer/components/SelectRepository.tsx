import { useState, useCallback, useContext, useEffect } from 'react';
import { Button, List, message } from 'antd';
import log from 'electron-log/renderer';
import { Error, UserSettingsRepository } from 'types';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

interface Props {
  setRepository: Function;
}

export default function SelectRepository({ setRepository }: Props) {
  const [repositories, setRepositories] = useState<UserSettingsRepository[]>(
    []
  );
  const [messageApi, contextHolder] = message.useMessage();

  const fetchRepositories = useCallback(async () => {
    setRepositories(await nowNoteAPI.getRepositories());
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const handleClickRepository = useCallback(
    async (path: string) => {
      log.debug('SelectRepository.handleClickRepository path:', path);

      const repository: UserSettingsRepository | undefined =
        await nowNoteAPI.connectRepository(path);
      log.debug('SelectRepository.handleClickRepository connected');
      setRepository(repository);
    },
    [setRepository]
  );

  const selectRepositoryFolder = useCallback(async () => {
    const repositoryOrError: UserSettingsRepository | Error | undefined =
      await nowNoteAPI.selectRepositoryFolder();
    log.debug('selectRepositoryFolder repositoryOrError:', repositoryOrError);
    if (repositoryOrError !== undefined && 'message' in repositoryOrError) {
      messageApi.open({
        type: 'error',
        content: repositoryOrError.message,
      });
    } else {
      setRepository(repositoryOrError);
    }
  }, [messageApi, setRepository]);

  return (
    <div className="nn-center-screen">
      {contextHolder}
      <div style={{ margin: '10px 100px' }}>
        {repositories && (
          <List
            bordered
            locale={{ emptyText: 'No repositories' }}
            dataSource={repositories}
            renderItem={(repository) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Button
                      size="small"
                      onClick={() => handleClickRepository(repository.path)}
                    >
                      {repository.path}
                    </Button>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
      <div className="nn-flex-break" />
      <div>
        <Button size="small" onClick={selectRepositoryFolder}>
          Add Repository Folder
        </Button>
      </div>
    </div>
  );
}
