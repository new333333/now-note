import { useState, useCallback } from 'react';
import { ConfigProvider, Spin } from 'antd';
import './App.scss';

export default function App() {
  const [longOperationProcessing, setLongOperationProcessing] = useState(false);
  const [isRepositoryInitialized, setIsRepositoryInitialized] = useState(false);

  const initRepository = useCallback(() => {
    setIsRepositoryInitialized(true);
    // let repositories = await this.dataSource.getRepositories();

    // let priorityStat = undefined;
      let repositorySettings = {};

    if (isRepositoryInitialized) {
        repositorySettings = await this.getRepositorySettings();
        priorityStat = await this.dataSource.getPriorityStat();
        repository = await this.dataSource.getRepository();
    }

    this.setState({
        repositories: repositories,
        priorityStat: priorityStat,
        repositorySettings: repositorySettings,
        repository: repository,

        detailsNote: undefined,
        listParentNote: undefined,
      },
      () => {
        //this.setAppStateFromSettings();
    });
    },
    [isRepositoryInitialized]
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      <Spin
        wrapperClassName="nn-spin-full-screen"
        delay={1000}
        spinning={longOperationProcessing}
      >
        {!isRepositoryInitialized && (
          <SelectRepository initRepository={initRepository} />
        )}
        {isRepositoryInitialized && <>repo choosed initialized</>}
      </Spin>
    </ConfigProvider>
  );
}
