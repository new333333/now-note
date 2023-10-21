import { useState, useCallback, useEffect } from 'react';
import { Button, List, Spin, message } from 'antd';
import log from 'electron-log/renderer';
import { Error, UserSettingsRepository } from 'types';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';

interface Props {
  setRepository: Function;
}

export default function SelectRepository({ setRepository }: Props) {
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<UserSettingsRepository[]>(
    []
  );
  const detailsNoteUpdateNote = useDetailsNoteStore(
    (state) => state.updateNote
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

      setLoading(true);
      detailsNoteUpdateNote(undefined);
      const repository: UserSettingsRepository | undefined =
        await nowNoteAPI.connectRepository(path);
      log.debug('SelectRepository.handleClickRepository connected');
      setRepository(repository);
      setLoading(false);
    },
    [detailsNoteUpdateNote, setRepository]
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
      <Spin spinning={loading} size="large" tip="Open the repository. Creating a new repository can take a bit of time.">
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
      </Spin>
    </div>
  );
}
