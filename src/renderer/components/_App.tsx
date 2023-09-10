import {
  useCallback,
  useContext,
  useEffect,
  forwardRef,
  useRef,
  useState,
} from 'react';
import { PlusOutlined, DeleteFilled } from '@ant-design/icons';
import {
  ConfigProvider,
  Space,
  Button,
  List,
  Modal,
  Alert,
  message,
  Spin,
  Drawer,
} from 'antd';
import './App.scss';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import {
  UserSettingsRepository,
  SearchResultOptions,
  NoteDTO,
  TagController,
} from 'types';
import Tree from './Tree';
import Note from './Note';
import SearchNotes from './SearchNotes';
import Footer from './Footer';

const $ = require('jquery');

window.jQuery = $;
window.$ = $;


export default function App() {
  // private dataService: TagController;

  const [longOperationProcessing, setLongOperationProcessing] = useState<boolean>(false);
  const [trash, setTrash] = useState<boolean>(false);
  // detailsNote -> moved to useStore
  const [isRepositoryInitialized, setIsRepositoryInitialized] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [repositorySettings, setRepositorySettings] = useState(undefined);
  const [showDeleteNoteConfirmationModal, setShowDeleteNoteConfirmationModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
/*
  constructor(props) {
    super(props);
    this.dataService = window.electron.ipcRenderer;

      this.openNoteDetails = this.openNoteDetails.bind(this);
      this.openNoteInTree = this.openNoteInTree.bind(this);
      this.openNoteInTreeAndDetails = this.openNoteInTreeAndDetails.bind(this);


      this.handleChangeDescription = this.handleChangeDescription.bind(this);

      this.addNote = this.addNote.bind(this);
      this.openTrash = this.openTrash.bind(this);
      this.delete = this.delete.bind(this);
      this.restore = this.restore.bind(this);
      this.hideModalDeleteNoteConfirmation = this.hideModalDeleteNoteConfirmation.bind(this);
      this.deletePermanently = this.deletePermanently.bind(this);
      this.saveRepositorySettings = this.saveRepositorySettings.bind(this);
      this.changeRepository = this.changeRepository.bind(this);
      this.treeIsInitialized = this.treeIsInitialized.bind(this);
      this.showHistory = this.showHistory.bind(this);

      this.treeDomRef = React.createRef();

      let self = this;


      this.initialRepository();

      // console.log("App ready");
  }
*/

/*
    async changeRepository() {
        await this.noteDomRef.current.saveChanges();
        await this.dataService.closeRepository();

        let repositories = await this.dataService.getRepositories();

        this.setState({
            repositories: repositories,
            isRepositoryInitialized: false,
            repository: undefined,
        });
    }
*/

/*
  async initialRepository() {
    // console.log("initialRepository start");
    const isRepositoryInitialized: boolean =
      await this.dataService.isRepositoryInitialized();
    const repositories: Array<UserSettingsRepository> | undefined = await this.dataService.getRepositories();
    console.log(
      'initialRepository isRepositoryInitialized=',
      isRepositoryInitialized
    );
    console.log('initialRepository repositories=', repositories);
    let repositorySettings: RepositorySettings | undefined;
    let repository;

    if (isRepositoryInitialized) {
      repositorySettings =
        await this.dataService.getRepositorySettings();
      repository = await this.dataService.getCurrentRepository();
    }

    console.log('initialRepository repositorySettings=', repositorySettings);
    console.log('initialRepository repository=', repository);

    this.setState(
      {
        isRepositoryInitialized,
        repositories,
        repositorySettings,
        repository,
        detailsNote: undefined,
      },
      () => {
        //this.setAppStateFromSettings();
      }
    );
  }
*/

/*
  treeIsInitialized() {
      this.setState({
          treeIsInitialized: true,
      }, () => {
          this.setAppStateFromSettings();
      });
  }
*/

/*
  async handleClickRepository(repositoryFolder: string) {
    const repository: UserSettingsRepository | undefined =
      await this.dataService.connectRepository(repositoryFolder);
    if (repository !== undefined) {
      await this.initialRepository();
    }
  }
*/

/*
  async setAppStateFromSettings() {
      // console.log("setAppStateFromSettings treeIsInitialized=" + this.state.treeIsInitialized);
      if (this.state.treeIsInitialized &&
          this.state.repositorySettings &&
          this.state.repositorySettings.state &&
          this.state.repositorySettings.state.details &&
          this.state.repositorySettings.state.details.key) {
          // it's app start and there is never trash on start, so check if note in trasj
          let note = await this.dataService.getNote(this.state.repositorySettings.state.details.key);
          if (note && !this.state.trash) {
              await this.openNoteInTreeAndDetails(this.state.repositorySettings.state.details.key);
          }
      }
      if (this.state.repositorySettings &&
          this.state.repositorySettings.state &&
          this.state.repositorySettings.state.list &&
          this.state.repositorySettings.state.list.key) {
                // it's app start and there is never trash on start, so check if note in trasj
          let note = await this.dataService.getNote(this.state.repositorySettings.state.list.key);
      }
  }
*/

/*
  async saveRepositorySettings() {
      // console.log("saveRepositorySettings,this.state.repositorySettings=", this.state.repositorySettings);

      this.dataService.setRepositorySettings(this.state.repositorySettings);
  }
*/

/*
  async selectRepositoryFolder() {
      let repositoryChoosenOK = await this.dataService.selectRepositoryFolder();
console.log('selectRepositoryFolder', repositoryChoosenOK);
      if (repositoryChoosenOK) {
          await this.initialRepository();
      }
  }
*/

/*
  // call from 'Add Note' Button
  async addNote() {
    // TODO: add spinner on add button, release after add note is ready
    await this.treeDomRef.current.addNote();
  }
*/

/*
  async openNoteDetails(key, editableTitle) {
    console.log('openNoteDetails(key: ' + key +')');
      if (this.state.detailsNote != undefined && key == this.state.detailsNote.key) {
          return;
      }
      if (key) {

          let detailsNote = await this.dataService.getNote(key);
          console.log('openNoteDetails detailsNote=', detailsNote);
          if (detailsNote.type === 'link') {
              detailsNote = detailsNote.linkedNote; // TODO: there is no linkedNote, onyl linkToKey
          }

          this.setState((prevState) => {

              let repositorySettings = prevState.repositorySettings;
              repositorySettings.state = repositorySettings.state || {};
              repositorySettings.state.details = repositorySettings.state.details || {};
              repositorySettings.state.details.key = detailsNote.key;
              return {
                  detailsNote: detailsNote,
                  repositorySettings: repositorySettings,
                  editableTitle: editableTitle
              }
          }, () => {
              this.saveRepositorySettings();
          });

      } else {
          this.setState((prevState) => {

              let repositorySettings = prevState.repositorySettings;
              repositorySettings.state = repositorySettings.state || {};
              repositorySettings.state.details = repositorySettings.state.details || {};
              delete repositorySettings.state.details.key;
              return {
                  detailsNote: undefined,
                  repositorySettings: repositorySettings,
                  editableTitle: false
              }
          }, () => {
              this.saveRepositorySettings();
          });
      }

  }
  */

  /*
  async openNoteInTree(key, editableTitle) {
      // console.log("openNoteInTree", key, editableTitle);

      let detailsNoteParents = await this.dataService.getParents(key);

      // console.log("openNoteInTree, detailsNoteParents=", detailsNoteParents);

      await this.treeDomRef.current.openNotes(detailsNoteParents, editableTitle);
  }
  */

  /*
  async openNoteInTreeAndDetails(key, editableTitle) {
      await this.openNoteInTree(key, editableTitle);
      await this.openNoteDetails(key);
  }
  */

  /*
  async handleChangeDescription(noteKey, description) {
      let self = this;

      return new Promise(function(resolve, reject) {
          self.dataService.modifyNote({
              key: noteKey,
              description: description
          }).then(function(modifiedNote) {
              // don't modify state, it prevents rendering
              console.log("handleChangeDescription modifiedNote=", modifiedNote);
              if (self.state.detailsNote.key == modifiedNote.key) {
                  self.state.detailsNote.description = modifiedNote.description;
              }
              resolve();
          });
      });


  }
  */

  /*
  async delete(key) {
      // console.log("delete, key=", key);

      if (!key) {
          // console.log("Note to delete cannot be undefined, key=", key);
          return;
      }

      let note = await this.dataService.getNote(key);
      // console.log("delete, note=", note);

      if (!note) {
          // console.log("Note to delete not exists, key=", key);
          return;
      }

      if (note.trash) {

          this.setState({
              showDeleteNoteConfirmationModal: true,
              deleteNoteKey: key
          });

      } else {
          this.setState({
              longOperationProcessing: true,
          });

          // console.log("moveNoteToTrash start");




          await this.dataService.moveNoteToTrash(key);
          // console.log("moveNoteToTrash done");

          this.setState({
              longOperationProcessing: false,

              detailsNote: undefined,
          });

          await this.treeDomRef.current.remove(note.key);

          message.warning(<Button type="link"
                          onClick={(event)=> this.restore(key)}
                      >Restore!</Button>);
      }
  }
  */

  /*
  async restore(key) {
      // console.log("restore, key=", key);

      if (!key) {
          // console.log("Note to restore cannot be undefined, key=", key);
          return;
      }

      let note = await this.dataService.getNote(key);
      // console.log("restore, note=", note);

      if (!note) {
          // console.log("Note to delete not exists, key=", key);
          return;
      }

      this.setState({
          longOperationProcessing: true,
      });

      // console.log("restore start");
      await this.dataService.restore(key);
      // console.log("restore done");


      this.setState({
          longOperationProcessing: false,
          detailsNote: undefined,
      }, () => {
          this.treeDomRef.current.reload(note.parent);
      });
  }
  */

  /*
  async deletePermanently() {
      // console.log("deletePermanently, key=", this.state.deleteNoteKey);

      if (!this.state.deleteNoteKey) {
          // console.log("Note to delete permanently cannot be undefined, this.state.deleteNoteKey=", this.state.deleteNoteKey);
          return;
      }

      let note = await this.dataService.getNote(this.state.deleteNoteKey);
      // console.log("deletePermanently, note=", note);

      if (!note) {
          // console.log("Note to delete permanently not exists, this.state.deleteNoteKey=", this.state.deleteNoteKey);
          return;
      }

      this.setState({
          longOperationProcessing: true,
          showDeleteNoteConfirmationModal: false,
      });

      await this.dataService.deletePermanently(this.state.deleteNoteKey);

      this.setState({
          longOperationProcessing: false,
          deleteNoteKey: undefined,

          detailsNote: undefined,
      }, () => {
          // console.log("openTrash new state", this.state.trash);
          this.treeDomRef.current.reload(note.parent);
      });

  }
  */

  /*
  async openTrash() {
      console.log("openTrash", this.state.trash);

      this.setState((previousState) => {
          // console.log("openTrash previousState", previousState);
          return {
              trash: !previousState.trash,
              listParentNote: undefined,
              detailsNote: undefined,
          };
      }, () => {
          // console.log("openTrash new state", this.state.trash);
          this.treeDomRef.current.reload();
      });
  }
  */

  /*
  hideModalDeleteNoteConfirmation() {
      // console.log("hideModalDeleteNoteConfirmation");

      this.setState({
          showDeleteNoteConfirmationModal: false,
          deleteNoteKey: undefined,
      });
  }
  */

  /*
  async showHistory() {
      console.log("showHistory now");

      this.setState({
          openHistory: true
      });
  }
  */

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b',
        },
      }}
    >
    <Spin wrapperClassName="nn-spin-full-screen" delay={1000} spinning={longOperationProcessing}>
      {

          !isRepositoryInitialized ?
          <div className='nn-center-screen'>
              <div style={{margin: "10px 100px"}}>
                  {repositories && <List
                      bordered
                      locale={{emptyText: "No repositories"}}
                      dataService={repositories}
                      renderItem={repository => (
                          <List.Item

                          >
                              <List.Item.Meta
                                  title={
                                          <a
                                          onClick={(event)=> this.handleClickRepository(repository.path)}>{repository.path}</a>
                                  }
                              />
                          </List.Item>
                      )}
                  />}
              </div>
              <div className="nn-flex-break"></div>
              <div>
                  <Button size="small"
                      onClick={(event)=> this.selectRepositoryFolder()}
                  >Add Repository Folder</Button>
              </div>
          </div>
          :
          <>
              <ReflexContainer orientation="vertical">

                  <ReflexElement className="left-bar"
                      minSize="200"
                      flex={0.25}>
                      <div className='n3-bar-vertical'>
                          <div className={`nn-header ${trash ? "nn-trash-background-color" : ""}`}>

                              <Space>
                                  <Button size="small" disabled={trash}
                                      onClick={(event)=> this.addNote()}
                                  ><PlusOutlined /> Add </Button>
                              </Space>

                          </div>
                          <Tree
                              ref={this.treeDomRef}
                              delete={this.delete}
                              restore={this.restore}
                              openNoteDetails={this.openNoteDetails}
                              handleChangeDone={this.handleChangeDone}
                              dataService={this.dataService}
                              trash={trash}
                              openNoteInTreeAndDetails={this.openNoteInTreeAndDetails}
                              treeIsInitialized={this.treeIsInitialized}
                              />
                          <div id="nn-trash">
                              {
                                  !trash &&
                                  <Button size="small" type="text" icon={<DeleteFilled />}
                                      onClick={(event)=> this.openTrash()}>
                                      Trash
                                  </Button>
                              }
                                                              {
                                  trash &&
                                  <Button size="small" type="text" danger icon={<DeleteFilled />}
                                      onClick={(event)=> this.openTrash()}>
                                      Close Trash
                                  </Button>
                              }

                          </div>
                      </div>
                  </ReflexElement>


                  <ReflexSplitter propagate={true}/>

                  <ReflexElement className="right-bar"
                      minSize="200"
                      flex={0.75}>
                      <div className='n3-bar-vertical'>
                          <div className={`nn-header ${trash ? "nn-trash-background-color" : ""}`}>
                              <SearchNotes
                                  trash={trash}
                              />

                          </div>

                          <Note />
                      </div>
                  </ReflexElement>

              </ReflexContainer>

              <Footer repository={repository} changeRepository={this.changeRepository}/>


          </>
      }

        {/*
          <Modal
              title="Modal"
              open={showDeleteNoteConfirmationModal}
              onOk={this.hideModalDeleteNoteConfirmation}
              onCancel={this.deletePermanently}
              okText="Cancel"
              cancelText="Delete"
          >
              <p>Do you want to delete note permanently?</p>
              <Alert message="It can not be recover anymore!" type="warning" />
              <p>The files and images will be NOT removed.</p>
          </Modal>
      */}
      </Spin>
    </ConfigProvider>
  );
}
