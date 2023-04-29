import { useState } from 'react';
import { Button, List, message } from 'antd';
import log from 'electron-log/renderer';
import { RepositoryInfo } from 'main/preload';

export default function SelectRepository({ initRepository }) {
  const [repositories, setRepositories] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  async function selectRepositoryFolder() {
    const repositoryOrError: RepositoryInfo =
      await window.electron.ipcRenderer.selectRepositoryFolder();
    log.debug('selectRepositoryFolder repositoryOrError:', repositoryOrError);
    if (repositoryOrError.error) {
      messageApi.open({
        type: 'error',
        content: repositoryOrError.error,
      });
    } else {
      await initRepository();
    }
  }

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
        <Button size="small" onClick={() => selectRepositoryFolder()}>
          Add Repository Folder
        </Button>
      </div>
    </div>
  );
}
