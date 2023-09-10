import { useState, useCallback, useContext, useEffect } from 'react';
import { Button, List, message } from 'antd';
import log from 'electron-log/renderer';
import { Error, UIController, UserSettingsRepository } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';

export default function SelectRepository() {
  const [repositories, setRepositories] = useState<UserSettingsRepository[]>(
    []
  );
  const [setCurrentRepository] = useNoteStore((state) => [
    state.setCurrentRepository,
  ]);

  const [messageApi, contextHolder] = message.useMessage();

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchRepositories = useCallback(async () => {
    setRepositories(await uiController.getRepositories());
  }, [uiController]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const handleClickRepository = useCallback(
    async (path: string) => {
      log.debug('SelectRepository.handleClickRepository path:', path);

      const repository: UserSettingsRepository | undefined =
        await uiController.connectRepository(path);
      setCurrentRepository(repository);
    },
    [setCurrentRepository, uiController]
  );

  const selectRepositoryFolder = useCallback(async () => {
    const repositoryOrError: UserSettingsRepository | Error | undefined =
      await uiController.selectRepositoryFolder();
    log.debug('selectRepositoryFolder repositoryOrError:', repositoryOrError);
    if (repositoryOrError !== undefined && 'message' in repositoryOrError) {
      messageApi.open({
        type: 'error',
        content: repositoryOrError.message,
      });
    } else {
      log.debug(
        'SelectRepository.selectRepositoryFolder() setCurrentRepository:',
        repositoryOrError
      );
      setCurrentRepository(repositoryOrError);
    }
  }, [messageApi, setCurrentRepository, uiController]);

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
