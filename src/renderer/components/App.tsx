import React from 'react';
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
import { ElectronHandler } from 'main/preload';
import { RepositorySettings } from 'main/modules/RepositorySettings/RepositorySettingsService';
import { UserSettingsRepository, PriorityStatDTO, SearchResultOptions, NoteDTO } from 'types';
import { Tree } from './Tree.jsx';
import { NotesList } from './NotesList.jsx';
import { Note } from './Note.jsx';
import { SearchNotes } from './SearchNotes';
import Footer from './Footer';

const $ = require('jquery');

window.jQuery = $;
window.$ = $;

let noteTypes = [
    {
        label: "Note",
        key: "note",
    },
    {
        label: "Task",
        key: "task",
    },
    {
        label: "Link",
        key: "link",
    }
];

export default class App extends React.Component {
  private dataSource: ElectronHandler;

    constructor(props) {
      super(props);
      this.dataSource = window.electron;

        this.state = {
            longOperationProcessing: false,
            trash: false,

            detailsNote: undefined,
            listParentNote: undefined,

            repositorySettings: undefined,

            showDeleteNoteConfirmationModal: false,
            openHistory: false,
        };

        this.openNoteDetails = this.openNoteDetails.bind(this);
        this.openNoteInTree = this.openNoteInTree.bind(this);
        this.openNoteInTreeAndDetails = this.openNoteInTreeAndDetails.bind(this);
        this.openNoteInList = this.openNoteInList.bind(this);
        this.openNoteInListLoadMore = this.openNoteInListLoadMore.bind(this);


        this.expandNote = this.expandNote.bind(this);
        this.handleChangeDone = this.handleChangeDone.bind(this);
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleChangePriority = this.handleChangePriority.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.addTag = this.addTag.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
        this.handleChangeTitle = this.handleChangeTitle.bind(this);
        this.getNoteTypeLabel = this.getNoteTypeLabel.bind(this);
        this.getOtherNoteTypeLabel = this.getOtherNoteTypeLabel.bind(this);
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
        this.simpleListDomRef = React.createRef();
        this.noteDomRef = React.createRef();

        let self = this;

        this.dataSource.ipcRenderer.onClose(function(event) {
            console.log("onClose App");

            self.beforeQuiteApp().then(function() {
                self.dataSource.ipcRenderer.setDirty(false).then(function() {
                    self.dataSource.ipcRenderer.quit();
                });
            });

        });


        this.initialRepository();

        // console.log("App ready");
    }


    async beforeQuiteApp() {
        console.log("beforeQuiteApp");
        if (this.noteDomRef.current) {
            await this.noteDomRef.current.saveChanges();
        }
        console.log("closeRepository");
        await this.dataSource.ipcRenderer.closeRepository();
    }

    async changeRepository() {
        await this.noteDomRef.current.saveChanges();
        await this.dataSource.ipcRenderer.closeRepository();

        let repositories = await this.dataSource.ipcRenderer.getRepositories();

        this.setState({
            repositories: repositories,
            isRepositoryInitialized: false,
            repository: undefined,
        });
    }

  async initialRepository() {
    // console.log("initialRepository start");
    const isRepositoryInitialized: boolean =
      await this.dataSource.ipcRenderer.isRepositoryInitialized();
    const repositories: Array<UserSettingsRepository> | undefined = await this.dataSource.ipcRenderer.getRepositories();
    console.log(
      'initialRepository isRepositoryInitialized=',
      isRepositoryInitialized
    );
    console.log('initialRepository repositories=', repositories);
    let priorityStat: PriorityStatDTO;
    let repositorySettings: RepositorySettings | undefined;
    let repository;

    if (isRepositoryInitialized) {
      repositorySettings =
        await this.dataSource.ipcRenderer.getRepositorySettings();
      priorityStat = await this.dataSource.ipcRenderer.getPriorityStat();
      repository = await this.dataSource.ipcRenderer.getCurrentRepository();
    }

    console.log('initialRepository repositorySettings=', repositorySettings);
    console.log('initialRepository repository=', repository);

    this.setState(
      {
        isRepositoryInitialized,
        repositories,
        priorityStat,
        repositorySettings,
        repository,
        detailsNote: undefined,
        listParentNote: undefined,
      },
      () => {
        //this.setAppStateFromSettings();
      }
    );
  }

    treeIsInitialized() {
        this.setState({
            treeIsInitialized: true,
        }, () => {
            this.setAppStateFromSettings();
        });
    }

  async handleClickRepository(repositoryFolder: string) {
    const repository: UserSettingsRepository | undefined =
      await this.dataSource.ipcRenderer.connectRepository(repositoryFolder);
    if (repository !== undefined) {
      await this.initialRepository();
    }
  }

    async setAppStateFromSettings() {
        // console.log("setAppStateFromSettings treeIsInitialized=" + this.state.treeIsInitialized);
        if (this.state.treeIsInitialized &&
            this.state.repositorySettings &&
            this.state.repositorySettings.state &&
            this.state.repositorySettings.state.details &&
            this.state.repositorySettings.state.details.key) {
            // it's app start and there is never trash on start, so check if note in trasj
            let note = await this.dataSource.ipcRenderer.getNote(this.state.repositorySettings.state.details.key);
            if (note && !note.trash) {
                await this.openNoteInTreeAndDetails(this.state.repositorySettings.state.details.key);
            }
        }
        if (this.state.repositorySettings &&
            this.state.repositorySettings.state &&
            this.state.repositorySettings.state.list &&
            this.state.repositorySettings.state.list.key) {
                 // it's app start and there is never trash on start, so check if note in trasj
            let note = await this.dataSource.ipcRenderer.getNote(this.state.repositorySettings.state.list.key);
            if (note && !note.trash) {
                await this.openNoteInList(this.state.repositorySettings.state.list.key);
            }
        }
    }



    async saveRepositorySettings() {
        // console.log("saveRepositorySettings,this.state.repositorySettings=", this.state.repositorySettings);

        this.dataSource.ipcRenderer.setRepositorySettings(this.state.repositorySettings);
    }



    async setFilter(filter) {
        this.setState((previousState) => {

            // console.log("setFilter, filter=, previousState.repositorySettings=", filter, previousState.repositorySettings);

            let newFilter = {...previousState.repositorySettings.filter, ...filter};
            // console.log("setFilter, newFilter=", newFilter);
            let newRepositorySettings = {...previousState.repositorySettings, ...{filter: newFilter}};
            // console.log("setFilter, newRepositorySettings=", newRepositorySettings);

            return {
                repositorySettings: newRepositorySettings
            }
        }, () => {
            this.saveRepositorySettings();
            this.openNoteInList();
        });
    }

    async selectRepositoryFolder() {
        let repositoryChoosenOK = await this.dataSource.ipcRenderer.selectRepositoryFolder();
console.log('selectRepositoryFolder', repositoryChoosenOK);
        if (repositoryChoosenOK) {
            await this.initialRepository();
        }
    }




  async addNote(key: string) {
    const editableTitle = true;
    const newNote: NoteDTO | undefined = await this.treeDomRef.current.addNote(
      key,
      editableTitle
    );
    await this.openNoteDetails(newNote.key, editableTitle);
  }


    async openNoteDetails(key, editableTitle) {
        if (this.state.detailsNote != undefined && key == this.state.detailsNote.key) {
            return;
        }
        if (key) {

            let detailsNote = await this.dataSource.ipcRenderer.getNote(key);
            if (detailsNote.type == "link") {
                detailsNote = detailsNote.linkedNote;
            }
            let detailsNoteParents = await this.dataSource.ipcRenderer.getParents(detailsNote.key, undefined);
            let detailsNoteBacklinks = await this.dataSource.ipcRenderer.getBacklinks(detailsNote.key);

            detailsNote.parents = detailsNoteParents;
            detailsNote.backlinks = detailsNoteBacklinks;

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

    async openNoteInTree(key, editableTitle) {
        // console.log("openNoteInTree", key, editableTitle);

        let detailsNoteParents = await this.dataSource.ipcRenderer.getParents(key);

        // console.log("openNoteInTree, detailsNoteParents=", detailsNoteParents);

        await this.treeDomRef.current.openNotes(detailsNoteParents, editableTitle);
    }

    async openNoteInTreeAndDetails(key, editableTitle) {
        await this.openNoteInTree(key, editableTitle);
        await this.openNoteDetails(key);
    }


    async openNoteInList(key) {

        // console.log("openNoteInList", key);

        this.setState({
            loadingList: true,
        });


        if (!key && this.state.listParentNote) {
            key = this.state.listParentNote.key;
        }

        if (!key) {
            this.setState({
                loadingList: false,
            });
            return;
        }

        let note = await this.dataSource.ipcRenderer.getNote(key);
        if ( (note.trash && !this.state.trash) ||
            (!note.trash && this.state.trash)) {
                this.setState({
                    listParentNote: undefined,
                    loadingList: false,
                });
                return;
        }
        let parents = await this.dataSource.ipcRenderer.getParents(key);
        note.parents = parents;

        let types = [];
        if (!this.state.repositorySettings.filter.onlyTasks && !this.state.repositorySettings.filter.onlyNotes) {
            types.push("'task'");
            types.push("'note'");
        } else if (this.state.repositorySettings.filter.onlyTasks) {
            types.push("'task'");
        } else if (!this.state.repositorySettings.filter.onlyNotes) {
            types.push("'note'");
        }

        let dones = [];
        if (!this.state.repositorySettings.filter.onlyDone && !this.state.repositorySettings.filter.onlyNotDone) {
            dones.push(0);
            dones.push(1);
        } else if (this.state.repositorySettings.filter.onlyDone) {
            dones.push(1);
        } else if (this.state.repositorySettings.filter.onlyNotDone) {
            dones.push(0);
        }

        const searchResultOptions: SearchResultOptions = {
          parentNotesKey: [note.key],
          types: types.length == 0 ? ["'note'", "'task'"] : types,
          dones: dones.length == 0 ? [0, 1] : dones,
          sortBy: "priority desc",
          offset: 0,
        };
        let searchResult = await this.dataSource.ipcRenderer.search("", 20, this.state.trash, searchResultOptions);

        note.filteredSiblings = searchResult.results;
        note.filteredSiblingsOffset = 20;
        note.filteredSiblingsHasMore = searchResult.maxResults > searchResult.results.length;
        note.filteredSiblingsMaxResults = searchResult.maxResults;

        this.setState((prevState) => {

            let repositorySettings = prevState.repositorySettings;
            repositorySettings.state = repositorySettings.state || {};
            repositorySettings.state.list = repositorySettings.state.list || {};
            repositorySettings.state.list.key = note.key;
            return {
                listParentNote: note,
                loadingList: false,
                repositorySettings: repositorySettings,
            }
        }, () => {
            this.saveRepositorySettings();
        });
    }


    async openNoteInListLoadMore() {

        let types = [];
        if (!this.state.repositorySettings.filter.onlyTasks && !this.state.repositorySettings.filter.onlyNotes) {
            types.push("'task'");
            types.push("'note'");
        } else if (this.state.repositorySettings.filter.onlyTasks) {
            types.push("'task'");
        } else if (!this.state.repositorySettings.filter.onlyNotes) {
            types.push("'note'");
        }

        let dones = [];
        if (!this.state.repositorySettings.filter.onlyDone && !this.state.repositorySettings.filter.onlyNotDone) {
            dones.push(0);
            dones.push(1);
        } else if (this.state.repositorySettings.filter.onlyDone) {
            dones.push(1);
        } else if (this.state.repositorySettings.filter.onlyNotDone) {
            dones.push(0);
        }

        const searchResultOptions: SearchResultOptions = {
          offset: this.state.listParentNote.filteredSiblingsOffset,
          parentNotesKey: [this.state.listParentNote.key],
          types: types.length == 0 ? ["'note'", "'task'"] : types,
          dones: dones.length == 0 ? [0, 1] : dones,
          sortBy: "priority desc"
        };
        let searchResult = await this.dataSource.ipcRenderer.search("", 20, this.state.trash, searchResultOptions);

        // note.filteredSiblings = searchResult.results;

        this.setState((previousState) => {
            if (previousState.listParentNote) {
                let filteredSiblings = [...previousState.listParentNote.filteredSiblings, ...searchResult.results];
                let listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
                listParentNote.filteredSiblings = filteredSiblings;
                listParentNote.filteredSiblingsOffset += 20;
                listParentNote.filteredSiblingsHasMore = searchResult.maxResults > listParentNote.filteredSiblings.length;
                listParentNote.filteredSiblingsMaxResults = searchResult.maxResults;
                return {
                    listParentNote: listParentNote
                };
            }
        });
    }

    async expandNote(key, expanded) {
        this.setState({
            longOperationProcessing: true,
        });
        let modifiedNote = await this.dataSource.ipcRenderer.modifyNote({
            key: key,
            expanded: expanded
        });
        this.setState({
            longOperationProcessing: false,
        });
    }


    async handleChangeDescription(noteKey, description) {
        let self = this;

        return new Promise(function(resolve, reject) {
            self.dataSource.ipcRenderer.modifyNote({
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

    async handleChangeTitle(noteKey, title) {
        // console.log("handleChangeTitle noteKey=, title=", noteKey, title);

        title = title.replaceAll("/", "");

        let self = this;
        return new Promise(function(resolve, reject) {

            self.setState((previousState) => {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.title = title;
                return {
                    longOperationProcessing: true,
                    // prevents update old title for a short time
                    detailsNote: note
                }
            }, () => {
                // console.log("handleChangeTitle save now");
                self.dataSource.ipcRenderer.modifyNote({
                    key: noteKey,
                    title: title
                }).then(function(modifiedNote) {
                    // console.log("handleChangeTitle modifiedNote=", modifiedNote);
                    self.setState((previousState) => {
                        if (previousState.detailsNote) {
                            let newState = {}
                            if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                                note.title = modifiedNote.title;
                                if (note.parents) {
                                    note.parents[note.parents.length - 1].title = title;
                                }
                                newState.detailsNote = note;
                            }
                            // console.log("handleChangeTitle listParentNote");
                            if (previousState.listParentNote) {
                                newState.listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
                                newState.listParentNote.filteredSiblings.forEach((note) => {
                                    if (note.key === noteKey) {
                                        note.title = title;
                                    }
                                });
                            }
                            // console.log("handleChangeTitle listParentNote done");
                            newState.longOperationProcessing = false;
                            return newState;
                        }
                    }, () => {
                        self.treeDomRef.current.setTitle(noteKey, title);
                        resolve();
                    });
                });
            });
        });
    }

    async handleChangeDone(noteKey, done, fromTree) {
        this.setState({
            longOperationProcessing: true,
        });

        let modifiedNote = await this.dataSource.ipcRenderer.modifyNote({
            key: noteKey,
            done: done
        });

        this.setState((previousState) => {
            let newState = {}

            if (previousState.detailsNote) {
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.done = done;
                    newState.detailsNote = note;
                }
            }
            if (previousState.listParentNote) {
                newState.listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
                newState.listParentNote.filteredSiblings.forEach((note) => {
                    if (note.key === noteKey) {
                        note.done = done;
                    }
                });
            }
            newState.longOperationProcessing = false;
            return newState;
        });

        if (!fromTree) {
            this.treeDomRef.current.setDone(noteKey, done);
        }

    }

    async handleChangeType(noteKey, type) {
        this.setState({
            longOperationProcessing: true,
        });

        let modifiedNote = await this.dataSource.ipcRenderer.modifyNote({
            key: noteKey,
            type: type
        });

        this.setState((previousState) => {
            let newState = {}

            if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.type = type;
                newState.detailsNote = note;
            }

            if (previousState.listParentNote) {
                newState.listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
                newState.listParentNote.filteredSiblings.forEach((note) => {
                    if (note.key === noteKey) {
                        note.type = type;
                    }
                });
            }
            newState.longOperationProcessing = false;
            return newState;
        });

        this.treeDomRef.current.setType(noteKey, type);
    }

    async handleChangePriority(noteKey: string, priority: string) {
      if (priority === undefined || priority === null) {
        return;
      }
      this.setState({
          longOperationProcessing: true,
      });

      let self = this;
      this.dataSource.ipcRenderer.getPriorityStat().then(function(priorityStat) {
          self.setState({
              priorityStat: priorityStat
          });
      });


      this.setState((previousState) => {
          let newState = {}

          if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
              let note = JSON.parse(JSON.stringify(previousState.detailsNote));
              note.priority = priority;
              newState.detailsNote = note;
          }

          if (previousState.listParentNote) {
              newState.listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
              newState.listParentNote.filteredSiblings.forEach((note) => {
                  if (note.key === noteKey) {
                      note.priority = priority;
                  }
              });
          }
          newState.longOperationProcessing = false;
          return newState;
      });

      this.treeDomRef.current.setPriority(noteKey, priority);
      await this.dataSource.ipcRenderer.modifyNote({
          key: noteKey,
          priority: priority
      });

    }

    async addTag(noteKey, tag) {
        this.setState({
            longOperationProcessing: true,
        });

        let tags = await this.dataSource.ipcRenderer.addTag(noteKey, tag);
        console.log("addTag", tag, tags);
        this.treeDomRef.current.setTags(noteKey, tags);


        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.tags = tags;
                return {
                    detailsNote: note,
                    longOperationProcessing: false,
                };
            }
        });

    }

    async deleteTag(noteKey, tag) {
        this.setState({
            longOperationProcessing: true,
        });

        let tags = await this.dataSource.ipcRenderer.removeTag(noteKey, tag);
        this.treeDomRef.current.setTags(noteKey, tags);


        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.tags = tags;
                return {
                    detailsNote: note,
                    longOperationProcessing: false,
                };
            }
        });
    }

    getNoteTypeLabel(type) {
        let foundType =  noteTypes.find(function(noteType) {
            return noteType.key === type;
        });
        if (!foundType) {
            throw new Error(`Unknown note type: '${type}'.`);
        }
        return foundType.label;
    }

    getOtherNoteTypeLabel(type) {
        let otherType =  noteTypes.find(function(noteType) {
            return noteType.key !== type;
        });
        return otherType.label;
    }

    async delete(key) {
        // console.log("delete, key=", key);

        if (!key) {
            // console.log("Note to delete cannot be undefined, key=", key);
            return;
        }

        let note = await this.dataSource.ipcRenderer.getNote(key);
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




            await this.dataSource.ipcRenderer.moveNoteToTrash(key);
            // console.log("moveNoteToTrash done");

            this.setState({
                longOperationProcessing: false,

                detailsNote: undefined,
            });

            await this.treeDomRef.current.remove(note.key);
            await this.openNoteInList();

            message.warning(<Button type="link"
                            onClick={(event)=> this.restore(key)}
                        >Restore!</Button>);
        }
    }

    async restore(key) {
        // console.log("restore, key=", key);

        if (!key) {
            // console.log("Note to restore cannot be undefined, key=", key);
            return;
        }

        let note = await this.dataSource.ipcRenderer.getNote(key);
        // console.log("restore, note=", note);

        if (!note) {
            // console.log("Note to delete not exists, key=", key);
            return;
        }

        this.setState({
            longOperationProcessing: true,
        });

        // console.log("restore start");
        await this.dataSource.ipcRenderer.restore(key);
        // console.log("restore done");


        this.setState({
            longOperationProcessing: false,
            detailsNote: undefined,
        }, () => {
            this.treeDomRef.current.reload(note.parent);
            this.openNoteInList();
        });
    }

    async deletePermanently() {
        // console.log("deletePermanently, key=", this.state.deleteNoteKey);

        if (!this.state.deleteNoteKey) {
            // console.log("Note to delete permanently cannot be undefined, this.state.deleteNoteKey=", this.state.deleteNoteKey);
            return;
        }

        let note = await this.dataSource.ipcRenderer.getNote(this.state.deleteNoteKey);
        // console.log("deletePermanently, note=", note);

        if (!note) {
            // console.log("Note to delete permanently not exists, this.state.deleteNoteKey=", this.state.deleteNoteKey);
            return;
        }

        this.setState({
            longOperationProcessing: true,
            showDeleteNoteConfirmationModal: false,
        });

        await this.dataSource.ipcRenderer.deletePermanently(this.state.deleteNoteKey);

        this.setState({
            longOperationProcessing: false,
            deleteNoteKey: undefined,

            detailsNote: undefined,
        }, () => {
            // console.log("openTrash new state", this.state.trash);
            this.treeDomRef.current.reload(note.parent);
            this.openNoteInList();
        });

    }

    async openTrash() {
        // console.log("openTrash", this.state.trash);

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

    hideModalDeleteNoteConfirmation() {
        // console.log("hideModalDeleteNoteConfirmation");

        this.setState({
            showDeleteNoteConfirmationModal: false,
            deleteNoteKey: undefined,
        });
    }

    async showHistory() {
        console.log("showHistory now");

        this.setState({
            openHistory: true
        });
    }



    render() {
        console.log("App render()");

        return (

            <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#00b96b',
              },
            }}
          >

<Drawer getContainer={false} title="Basic Drawer" placement="right" open={this.state.openHistory}>
                            <p>Some contents...</p>
                            <p>Some contents...</p>
                            <p>Some contents...</p>
                        </Drawer>

            <Spin wrapperClassName="nn-spin-full-screen" delay={1000} spinning={this.state.longOperationProcessing}>



                {

                    !this.state.isRepositoryInitialized ?
                    <div className='nn-center-screen'>
                        <div style={{margin: "10px 100px"}}>
                            {this.state.repositories && <List
                                bordered
                                locale={{emptyText: "No repositories"}}
                                dataSource={this.state.repositories}
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
                        {/* <div id="nn-top-menu">
                            <Menu mode="horizontal" defaultSelectedKeys={['mail']}>
                                <Menu.Item key="mail">
                                Navigation One
                                </Menu.Item>
                                <Menu.SubMenu key="SubMenu" title="Navigation Two - Submenu">
                                <Menu.Item key="two" >
                                    Navigation Two
                                </Menu.Item>
                                <Menu.Item key="three" >
                                    Navigation Three
                                </Menu.Item>
                                <Menu.ItemGroup title="Item Group">
                                    <Menu.Item key="four" >
                                    Navigation Four
                                    </Menu.Item>
                                    <Menu.Item key="five" >
                                    Navigation Five
                                    </Menu.Item>
                                </Menu.ItemGroup>
                                </Menu.SubMenu>
                            </Menu>
                        </div> */}
                        <ReflexContainer orientation="vertical">

                            <ReflexElement className="left-bar"
                                minSize="200"
                                flex={0.25}>
                                <div className='n3-bar-vertical'>
                                    <div className={`nn-header ${this.state.trash ? "nn-trash-background-color" : ""}`}>

                                        <Space>
                                            <Button size="small" disabled={this.state.trash}
                                                onClick={(event)=> this.addNote()}
                                            ><PlusOutlined /> Add </Button>
                                        </Space>

                                    </div>
                                    <Tree
                                        ref={this.treeDomRef}
                                        delete={this.delete}
                                        restore={this.restore}
                                        openNoteDetails={this.openNoteDetails}
                                        addNote={this.addNote}
                                        expandNote={this.expandNote}
                                        handleChangeDone={this.handleChangeDone}
                                        handleChangeTitle={this.handleChangeTitle}
                                        dataSource={this.dataSource}
                                        trash={this.state.trash}
                                        openNoteInList={this.openNoteInList}
                                        openNoteInTreeAndDetails={this.openNoteInTreeAndDetails}
                                        treeIsInitialized={this.treeIsInitialized}
                                        />
                                    <div id="nn-trash">
                                        {
                                            !this.state.trash &&
                                            <Button size="small" type="text" icon={<DeleteFilled />}
                                                onClick={(event)=> this.openTrash()}>
                                                Trash
                                            </Button>
                                        }
                                                                        {
                                            this.state.trash &&
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
                                flex={0.5}>
                                <div className='n3-bar-vertical'>
                                    <div className={`nn-header ${this.state.trash ? "nn-trash-background-color" : ""}`}>
                                        <SearchNotes
                                            trash={this.state.trash}
                                            dataSource={this.dataSource}
                                            openNoteInTree={this.openNoteInTree}
                                            openNoteDetails={this.openNoteDetails}
                                            openNoteInTreeAndDetails={this.openNoteInTreeAndDetails}
                                        />

                                    </div>

                                    <Note
                                        ref={this.noteDomRef}

                                        dataSource={this.dataSource}

                                        noteTypes={noteTypes}
                                        getNoteTypeLabel={this.getNoteTypeLabel}
                                        getOtherNoteTypeLabel={this.getOtherNoteTypeLabel}
                                        priorityStat={this.state.priorityStat}

                                        note={this.state.detailsNote}
                                        editableTitle={this.state.editableTitle}

                                        handleChangeDone={this.handleChangeDone}
                                        handleChangeType={this.handleChangeType}
                                        handleChangeTitle={this.handleChangeTitle}

                                        handleChangeDescription={this.handleChangeDescription}
                                        handleChangePriority={this.handleChangePriority}


                                        addNote={this.addNote}
                                        addTag={this.addTag}
                                        deleteTag={this.deleteTag}
                                        openNoteDetails={this.openNoteDetails}
                                        openNoteInTreeAndDetails={this.openNoteInTreeAndDetails}
                                        openNoteInTree={this.openNoteInTree}
                                        openNoteInList={this.openNoteInList}
                                        delete={this.delete}
                                        restore={this.restore}
                                        showHistory={this.showHistory}

                                        trash={this.state.trash}
                                    />
                                </div>
                            </ReflexElement>

                            <ReflexSplitter propagate={true}/>

                            <ReflexElement minSize="200" flex={0.25}>
                                <NotesList
                                    ref={this.simpleListDomRef}

                                    note={this.state.listParentNote}
                                    loading={true && this.state.loadingList}
                                    openNoteInListLoadMore={this.openNoteInListLoadMore}

                                    trash={this.state.trash}

                                    noteTypes={noteTypes}
                                    handleChangeDone={this.handleChangeDone}
                                    handleChangeType={this.handleChangeType}
                                    handleChangePriority={this.handleChangePriority}

                                    openNoteDetails={this.openNoteDetails}
                                    openNoteInTreeAndDetails={this.openNoteInTreeAndDetails}

                                    setFilter={this.setFilter}
                                    filter={this.state.repositorySettings !== undefined && this.state.repositorySettings.filter !== undefined ? this.state.repositorySettings.filter : {}}
                                    openNoteInTree={this.openNoteInTree}
                                    openNoteInList={this.openNoteInList}

                                    getNoteTypeLabel={this.getNoteTypeLabel}
                                />
                            </ReflexElement>

                        </ReflexContainer>

                        <Footer repository={this.state.repository} changeRepository={this.changeRepository}/>


                    </>
                }


                <Modal
                    title="Modal"
                    open={this.state.showDeleteNoteConfirmationModal}
                    onOk={this.hideModalDeleteNoteConfirmation}
                    onCancel={this.deletePermanently}
                    okText="Cancel"
                    cancelText="Delete"
                >
                    <p>Do you want to delete note permanently?</p>
                    <Alert message="It can not be recover anymore!" type="warning" />
                    <p>The files and images will be NOT removed.</p>
                </Modal>

            </Spin>
            </ConfigProvider>
        )
    }
}