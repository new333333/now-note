import log from 'electron-log';
import { useEffect, useContext, useCallback } from 'react';
import { ConfigProvider, Space } from 'antd';
import './App.scss';
import useNoteStore from 'renderer/GlobalStore';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import SelectRepository from './SelectRepository';
import Footer from './Footer';
import SearchNotes from './SearchNotes';
import TreeComponent from './TreeComponent';
import AddNoteButton from './AddNoteButton';
import TrashButton from './TrashButton';
import DetailsNoteComponent from './DetailsNoteComponent';

const appLog = log.scope('App');

export default function App() {
  const [currentRepository, setCurrentRepository, trash] = useNoteStore(
    (state) => [
      state.currentRepository,
      state.setCurrentRepository,
      state.trash,
    ]
  );

  const fetchCurrentRepository = useCallback(async () => {
    setCurrentRepository(await nowNoteAPI.getCurrentRepository());
  }, [setCurrentRepository, nowNoteAPI]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

  appLog.debug(`currentRepository=${currentRepository} trash=${trash}`);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
      {currentRepository === undefined && <SelectRepository />}
      {currentRepository !== undefined &&
        <>
          <ReflexContainer orientation="vertical">
            <ReflexElement className="left-bar" minSize="200" flex={0.25}>
              <div className="n3-bar-vertical">
                <AddNoteButton />
                <TreeComponent />
                <div id="nn-trash">
                  <TrashButton />
                </div>
              </div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement className="right-bar" minSize="200" flex={0.75}>
              <div className="n3-bar-vertical">
                <div className="nn-header">
                  <SearchNotes />
                </div>
                <DetailsNoteComponent />
              </div>
            </ReflexElement>
          </ReflexContainer>
          <Footer />
        </>
      }
    </ConfigProvider>
  );
}
