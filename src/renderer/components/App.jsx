import React from 'react';

import { ApartmentOutlined, UserOutlined , BarsOutlin1ed, NodeExpandOutlined, PlusOutlined, ThunderboltFilled, RetweetOutlined } from '@ant-design/icons';
import { Input, Space, Button, List, Modal, Alert, message, Spin } from 'antd';
import {DeleteFilled } from '@ant-design/icons';

const { Search } = Input;

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
  
import 'react-reflex/styles.css'
import {FancyTree} from './FancyTree.jsx';
import {NotesList} from './NotesList.jsx';
import {Note} from './Note.jsx';
import {SearchNotes} from './SearchNotes.jsx';
import {Footer} from './Footer.jsx';

let noteTypes = [
    {
        label: "Note",
        key: "note",
    },
    {
        label: "Task",
        key: "task",
    }
];

let defaultFilter = {
    onlyNotes: false,
    onlyTasks: false,
    onlyDone: false,
    onlyNotDone: false, 
}

class App extends React.Component {

    constructor(props) {
        super(props);

        console.log("App starten");

        this.dataSource = window.electronAPI;

        this.state = {
            longOperationProcessing: false,
            trash: false,
            
            activeNote: undefined,
            detailsNote: undefined,
            listParentNote: undefined,

            repositorySettings: {
                filter: defaultFilter
            },

            showDeleteNoteConfirmationModal: false,
        };
        this.loadTree = this.loadTree.bind(this);
        
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
        this.saveTitle = this.saveTitle.bind(this);
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

        this.fancyTreeDomRef = React.createRef();
        this.simpleListDomRef = React.createRef();
        this.noteDomRef = React.createRef();

        let self = this;

        this.dataSource.onChangeRepository((_event, value) => {
            self.changeRepository();
        });

        this.initialRepository();

        console.log("App ready");
    }

    async changeRepository() {
        await this.noteDomRef.current.saveChanges();
        await this.dataSource.closeRepository();

        let repositories = await this.dataSource.getRepositories();

        this.setState({
            repositories: repositories,
            isRepositoryInitialized: false,
            repository: undefined,
        });
    }

    async initialRepository() {
        console.log("initialRepository start");
        let isRepositoryInitialized = await this.dataSource.isRepositoryInitialized();
        let repositories = await this.dataSource.getRepositories();

        let priorityStat = undefined;
        let repositorySettings = {};
        let repository = undefined;

        if (isRepositoryInitialized) {
            repositorySettings = await this.getRepositorySettings();
            priorityStat = await this.dataSource.getPriorityStat();
            repository = await this.dataSource.getRepository();
        }
        
        console.log("initialRepository repositorySettings=", repositorySettings);
        console.log("initialRepository repository=", repository);

        this.setState({
            isRepositoryInitialized: isRepositoryInitialized,
            repositories: repositories,
            priorityStat: priorityStat,
            repositorySettings: repositorySettings,
            repository: repository,

            detailsNote: undefined,
            activeNote: undefined,
            listParentNote: undefined,
        });
    }

    async getRepositorySettings() {
        let repositorySettings = await this.dataSource.getRepositorySettings();
        console.log("repositorySettings loaded", repositorySettings);

        if (!repositorySettings.filter) {
            repositorySettings.filter = defaultFilter;
        }

        return repositorySettings;
    }

    async saveRepositorySettings() {
        console.log("saveRepositorySettings,this.state.repositorySettings=", this.state.repositorySettings);

        this.dataSource.setRepositorySettings(this.state.repositorySettings);
    }

    async setFilter(filter) {
        this.setState((previousState) => {

            console.log("setFilter, filter=, previousState.repositorySettings=", filter, previousState.repositorySettings);

            let newFilter = {...previousState.repositorySettings.filter, ...filter};
            console.log("setFilter, newFilter=", newFilter);
            let newRepositorySettings = {...previousState.repositorySettings, ...{filter: newFilter}};
            console.log("setFilter, newRepositorySettings=", newRepositorySettings);

            return {
                repositorySettings: newRepositorySettings
            }
        }, () => { 
            this.saveRepositorySettings();
            this.openNoteInList();
        });
    }

    async chooseRepositoryFolder() {
        let repositoryChoosenOK = await this.dataSource.chooseRepositoryFolder();

        if (repositoryChoosenOK) {
            await this.initialRepository();
        }
    }

    async handleClickRepository(repositoryFolder) {
        let repositoryChanged = await this.dataSource.changeRepository(repositoryFolder);
        console.log("handleClickRepository", repositoryChanged);

        if (repositoryChanged) {
            await this.initialRepository();
        }
    }


    loadTree(key, data) {
        let self = this;
        console.log("loadTree, key=, this.state.trash=", key, this.state.trash);
        
        if (key.type == 'source') {

            return this.dataSource.getChildren(null, this.state.trash).then(function(rootNodes) {
                rootNodes = self.mapToTreeData(rootNodes);

                // console.log("loadTree, rootNodes=", rootNodes);


                return rootNodes;
            });
          

        } else if (data.node) {

            data.result = this.dataSource.getChildren(data.node.key, this.state.trash).then(function(children) {
                children = self.mapToTreeData(children);
                return children;
            });

        }

    }

    mapToTreeData(tree) {
        tree = mapNotesToTreeNodes(tree);
        return tree;
    
    
        function mapNotesToTreeNodes(tree) {
            if (!tree) {
                return tree;
            }
    
            for (let i = 0; i < tree.length; i++) {
    
                tree[i].data = tree[i].data || {};
                tree[i].data.description = tree[i].description;
                tree[i].data.modifiedBy = tree[i].modifiedBy;
                tree[i].data.modifiedOn = tree[i].modifiedOn;
                tree[i].data.createdBy = tree[i].createdBy;
                tree[i].data.createdOn = tree[i].createdOn;
                tree[i].data.done = tree[i].done;
                tree[i].data.priority = tree[i].priority;
                tree[i].data.type = tree[i].type;
                tree[i].data.tags = tree[i].tags;
                
    
                delete tree[i].parent;
                delete tree[i].modifiedOn;
                delete tree[i].modifiedBy;
                delete tree[i].description;
                delete tree[i].createdOn;
                delete tree[i].createdBy;
                delete tree[i].done;
                delete tree[i].priority;
                delete tree[i].type;
                delete tree[i].tags;
    
                tree[i].lazy = true;
                
                if (!tree[i].hasChildren) {
                    tree[i].children = [];
                }
                setCheckBoxFromTyp(tree[i]);
    
            }
    
            return tree;
        }
    
        function setCheckBoxFromTyp(node) {
            if (!node) {
                return node;
            }
    
            node.data = node.data || {};
            node.checkbox = node.data.type !== undefined && node.data.type === "task";
            node.selected = node.data.done !== undefined && node.data.done;
            node.unselectable = node.trash;

            return node;
        }
    
    }

    async addNote(key) {
        // console.log("addNote");
        key = key || this.state.activeNote.key;
        let newNote = await this.fancyTreeDomRef.current.addNote(key);
        this.openNoteInTreeAndDetails(newNote.key);
        console.log("addNote, newNote=", newNote);
        this.openNoteDetails(newNote.key);
        return newNote;
    }


    async openNoteDetails(key) {
        console.log("openNoteDetails", key);
        if (key) {

            let detailsNote = await this.dataSource.getNote(key);
            let detailsNoteParents = await this.dataSource.getParents(key);
            let detailsNoteBacklinks = await this.dataSource.getBacklinks(key);

            detailsNote.parents = detailsNoteParents;
            detailsNote.backlinks = detailsNoteBacklinks;

            this.setState({
                detailsNote: detailsNote
            });

        } else {
            this.setState({
                detailsNote: undefined,
            });
        }

    }

    async openNoteInTree(key) {
        console.log("openNoteInTree", key);

        let detailsNoteParents = await this.dataSource.getParents(key);

        console.log("openNoteInTree, detailsNoteParents=", detailsNoteParents);

        await this.fancyTreeDomRef.current.openNotes(detailsNoteParents);
    }

    async openNoteInTreeAndDetails(key) {
        console.log("openNoteInTreeAndDetails", key);

        await this.openNoteInTree(key);
        await this.openNoteDetails(key);
    }


    async openNoteInList(key) {

        this.setState({
            loadingList: true,
        });


        if (this.state.listParentNote) {
            key = this.state.listParentNote.key;
        }

        let note = await this.dataSource.getNote(key);
        if ( (note.trash && !this.state.trash) || 
            (!note.trash && this.state.trash)) {
                this.setState({
                    listParentNote: undefined,
                    loadingList: false,
                });
                return;
        }
        let parents = await this.dataSource.getParents(key);
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
        
        let searchResult = await this.dataSource.search("", 20, this.state.trash, {
            parentNotesKey: [note.key],
            types: types.length == 0 ? ["'note'", "'task'"] : types,
            dones: dones.length == 0 ? [0, 1] : dones,
            sortBy: "priority desc"
        });

        note.filteredSiblings = searchResult.results;
        note.filteredSiblingsOffset = 20;
        note.filteredSiblingsHasMore = searchResult.maxResults > searchResult.results.length;
        note.filteredSiblingsMaxResults = searchResult.maxResults;

        this.setState({
            listParentNote: note,
            loadingList: false,
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
        
        let searchResult = await this.dataSource.search("", 20, this.state.trash, {
            offset: this.state.listParentNote.filteredSiblingsOffset,
            parentNotesKey: [this.state.listParentNote.key],
            types: types.length == 0 ? ["'note'", "'task'"] : types,
            dones: dones.length == 0 ? [0, 1] : dones,
            sortBy: "priority desc"
        });

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
        let modifiedNote = await this.dataSource.modifyNote({
            key: key, 
            expanded: expanded	
        });
    }


    async handleChangeDescription(noteKey, description) {
        // console.log("handleChangeDescription noteKey=, description=", noteKey, description);
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            description: description	
        });
        
        // console.log("handleChangeDescription modifiedNote=", modifiedNote);
        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let newState = {}
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.description = modifiedNote.description;
                    newState.detailsNote = note;
                }

                return newState;
            }
        });

    }

    async handleChangeTitle(noteKey, title) {
        this.dataSource.modifyNote({
            key: noteKey, 
            title: title	
        });

        title = title.replaceAll("/", "");
        this.setState((previousState) => {
            let newState = {}

            if (previousState.detailsNote) {
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.title = title;
                    if (note.parents) {
                        note.parents[note.parents.length - 1].title = title;
                    }
                    newState.detailsNote = note;
                }
            }

            if (previousState.listParentNote) {
                newState.listParentNote = JSON.parse(JSON.stringify(previousState.listParentNote));
                newState.listParentNote.filteredSiblings.forEach((note) => {
                    if (note.key === noteKey) {
                        note.title = title;
                    }
                });
            }
            return newState;
        }, () => {
            this.fancyTreeDomRef.current.setTitle(noteKey, title);
        });
    }

    async saveTitle(noteKey, title) {
        await this.dataSource.modifyNote({
            key: noteKey, 
            title: title	
        });
    }

    async handleChangeDone(noteKey, done, fromTree) {
        let modifiedNote = await this.dataSource.modifyNote({
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

            return newState;
        });

        if (!fromTree) {
            this.fancyTreeDomRef.current.setDone(noteKey, done);
        }

    }

    async handleChangeType(noteKey, type) {
        let modifiedNote = await this.dataSource.modifyNote({
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

            return newState;
        });

        this.fancyTreeDomRef.current.setType(noteKey, type);
    }

    async handleChangePriority(noteKey, priority) {
        let self = this;
        this.dataSource.getPriorityStat().then(function(priorityStat) {
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

            return newState;
        });

        this.fancyTreeDomRef.current.setPriority(noteKey, priority);
        await this.dataSource.modifyNote({
            key: noteKey, 
            priority: priority	
        });

    }

    async addTag(noteKey, tag) {
        let tags = await this.dataSource.addTag(noteKey, tag);
        this.fancyTreeDomRef.current.setTags(noteKey, tags);

        
        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.tags = tags;
                return {
                    detailsNote: note,
                };
            }
        });

    }

    async deleteTag(noteKey, tag) {
        let tags = await this.dataSource.removeTag(noteKey, tag);
        this.fancyTreeDomRef.current.setTags(noteKey, tags);

        
        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.tags = tags;
                return {
                    detailsNote: note,
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
        console.log("delete, key=", key);

        if (!key) {
            console.log("Note to delete cannot be undefined, key=", key);
            return;
        }

        let note = await this.dataSource.getNote(key);
        console.log("delete, note=", note);

        if (!note) {
            console.log("Note to delete not exists, key=", key);
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
            
            console.log("moveNoteToTrash start");




            await this.dataSource.moveNoteToTrash(key);
            console.log("moveNoteToTrash done");

            this.setState({
                longOperationProcessing: false,
                
                detailsNote: undefined,
                activeNote: undefined,
            });

            await this.fancyTreeDomRef.current.reload(note.parent);
            await this.openNoteInList();

            message.warning(<Button type="link"
                            onClick={(event)=> this.restore(key)}
                        >Restore!</Button>);
        }
    }

    async restore(key) {
        console.log("restore, key=", key);

        if (!key) {
            console.log("Note to restore cannot be undefined, key=", key);
            return;
        }

        let note = await this.dataSource.getNote(key);
        console.log("restore, note=", note);

        if (!note) {
            console.log("Note to delete not exists, key=", key);
            return;
        }

        this.setState({
            longOperationProcessing: true,
        });

        console.log("restore start");
        await this.dataSource.restore(key);
        console.log("restore done");


        this.setState({
            longOperationProcessing: false,
            detailsNote: undefined,
            activeNote: undefined,
        }, () => { 
            this.fancyTreeDomRef.current.reload(note.parent);
            this.openNoteInList();
        });
    }

    async deletePermanently() {
        console.log("deletePermanently, key=", this.state.deleteNoteKey);

        if (!this.state.deleteNoteKey) {
            console.log("Note to delete permanently cannot be undefined, this.state.deleteNoteKey=", this.state.deleteNoteKey);
            return;
        }

        let note = await this.dataSource.getNote(this.state.deleteNoteKey);
        console.log("deletePermanently, note=", note);

        if (!note) {
            console.log("Note to delete permanently not exists, this.state.deleteNoteKey=", this.state.deleteNoteKey);
            return;
        }

        this.setState({
            longOperationProcessing: true,
            showDeleteNoteConfirmationModal: false,
        });

        await this.dataSource.deletePermanently(this.state.deleteNoteKey);

        this.setState({
            longOperationProcessing: false,
            deleteNoteKey: undefined,

            detailsNote: undefined,
            activeNote: undefined,
        }, () => { 
            console.log("openTrash new state", this.state.trash);
            this.fancyTreeDomRef.current.reload(note.parent);
            this.openNoteInList();
        });
        
    }

    async openTrash() {
        console.log("openTrash", this.state.trash);

        this.setState((previousState) => {
            console.log("openTrash previousState", previousState);
            return {
                trash: !previousState.trash,
                listParentNote: undefined,
                detailsNote: undefined,
                activeNote: undefined,
            };
        }, () => { 
            console.log("openTrash new state", this.state.trash);
            this.fancyTreeDomRef.current.reload();
        });
        
    }
    
    hideModalDeleteNoteConfirmation() {
        console.log("hideModalDeleteNoteConfirmation");

        this.setState({
            showDeleteNoteConfirmationModal: false,
            deleteNoteKey: undefined,
        });
    }

  

    render() {


        console.log("App render start");
        console.log("App render this.state.repositories=", this.state.repositories);
        console.log("App render this.state.isRepositoryInitialized=", this.state.isRepositoryInitialized);
        

        return (

            <Spin wrapperClassName="nn-spin-full-screen" spinning={this.state.longOperationProcessing}>
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
                                onClick={(event)=> this.chooseRepositoryFolder()}
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
                                    <div className={`nn-header ${this.state.trash ? "nn-trash-background-color" : ""}`}>

                                        <Space>
                                            <Button size="small" disabled={this.state.trash}
                                                onClick={(event)=> this.addNote()}
                                            ><PlusOutlined /> Add note </Button>
                                        </Space>
                                            
                                    </div>
                                    <FancyTree
                                        ref={this.fancyTreeDomRef}
                                        loadTree={this.loadTree} 
                                        delete={this.delete}
                                        restore={this.restore}
                                        openNoteDetails={this.openNoteDetails}
                                        addNote={this.addNote}
                                        expandNote={this.expandNote}
                                        handleChangeDone={this.handleChangeDone} 
                                        dataSource={this.dataSource}
                                        trash={this.state.trash}
                                        openNoteInList={this.openNoteInList}
                                        
                                        />
                                    <div style={{backgroundColor: "#efefef"}}>
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

                                        handleChangeDone={this.handleChangeDone} 
                                        handleChangeType={this.handleChangeType} 
                                        handleChangeTitle={this.handleChangeTitle}
                                        saveTitle={this.saveTitle}
                                        
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
                                    filter={this.state.repositorySettings ? this.state.repositorySettings.filter : defaultFilter}
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
                    visible={this.state.showDeleteNoteConfirmationModal}
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
        )
    }
}

export {App};