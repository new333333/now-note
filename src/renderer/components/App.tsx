import { useEffect, useContext, useCallback } from 'react';
import { ConfigProvider, Space } from 'antd';
import './App.scss';
import useNoteStore from 'renderer/NoteStore';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import SelectRepository from './SelectRepository';
import Footer from './Footer';
import SearchNotes from './SearchNotes';
import Note from './Note';
import Tree from './Tree';
import AddNoteButton from './AddNoteButton';
import TrashButton from './TrashButton';
import Tree2 from './Tree2';

export default function App() {
  const [currentRepository, setCurrentRepository, trash] = useNoteStore(
    (state) => [
      state.currentRepository,
      state.setCurrentRepository,
      state.trash,
    ]
  );

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchCurrentRepository = useCallback(async () => {
    setCurrentRepository(await uiController.getCurrentRepository());
  }, [setCurrentRepository, uiController]);

  useEffect(() => {
    fetchCurrentRepository();
  }, [fetchCurrentRepository]);

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
                <Tree />
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
                <Note />
              </div>
            </ReflexElement>
          </ReflexContainer>
          <Footer />
        </>
      }
    </ConfigProvider>
  );
}
