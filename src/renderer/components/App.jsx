import React from 'react';

import { ApartmentOutlined, UserOutlined , BarsOutlin1ed, NodeExpandOutlined, PlusOutlined, ThunderboltFilled } from '@ant-design/icons';
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
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
import { isThisQuarter } from 'date-fns/esm';

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

let defaultRepositorySettings ={
    filterOnlyNotes: false,
    filterOnlyTasks: false,
    filterOnlyDone: false,
    filterOnlyNotDone: false, 
}


class App extends React.Component {

    constructor() {
        super();

        console.log("App starten");

        this.dataSource = window.electronAPI;

        this.state = {
            longOperationProcessing: false,
            trash: false,
            
            activeNoteKey: undefined,
            activeNote: undefined,
            detailsNote: undefined,
            childNotes: undefined,

            repositorySettings: defaultRepositorySettings,
            

            showDeleteNoteConfirmationModal: false,
        };
        this.loadTree = this.loadTree.bind(this);
        this.openNoteDetails = this.openNoteDetails.bind(this);
        this.openNoteInTree = this.openNoteInTree.bind(this);
        this.activateNote = this.activateNote.bind(this);
        this.expandNote = this.expandNote.bind(this);
        this.handleChangeDone = this.handleChangeDone.bind(this);
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleChangePriority = this.handleChangePriority.bind(this);
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

        this.setFilterOnlyTasks = this.setFilterOnlyTasks.bind(this);
        this.setFilterOnlyNotes = this.setFilterOnlyNotes.bind(this);

        this.setFilterOnlyDone = this.setFilterOnlyDone.bind(this);
        this.setFilterOnlyNotDone = this.setFilterOnlyNotDone.bind(this);

        this.fancyTreeDomRef = React.createRef();
        this.simpleListDomRef = React.createRef();

        let self = this;

        this.dataSource.onChangeRepository((_event, value) => {
            // console.log("onChangeRepository", _event, value);

            self.dataSource.closeRepository().then(function() {
                // console.log("closeRepository done");

                self.dataSource.getRepositories().then(function(repositories) {
                    self.setState({
                        repositories: repositories,
                        isRepositoryInitialized: false
                    });
                });
            });
        });

        this.initialRepository();

        console.log("App ready");
    }

    async initialRepository() {
        console.log("initialRepository start");
        let isRepositoryInitialized = await this.dataSource.isRepositoryInitialized();
        let repositories = await this.dataSource.getRepositories();

        let priorityStat = undefined;
        let repositorySettings = {};

        if (isRepositoryInitialized) {
            repositorySettings = await this.getRepositorySettings();
            priorityStat = await this.dataSource.getPriorityStat();
        }
        
        console.log("initialRepository repositorySettings=", repositorySettings);
        this.setState({
            isRepositoryInitialized: isRepositoryInitialized,
            repositories: repositories,
            priorityStat: priorityStat,
            repositorySettings: repositorySettings,
        });
    }

    async getRepositorySettings() {
        let repositorySettings = await this.dataSource.getRepositorySettings();
        console.log("repositorySettings loaded", repositorySettings);

        repositorySettings = {...defaultRepositorySettings, ...repositorySettings};

        console.log("repositorySettings merged", repositorySettings);

        return repositorySettings;
    }

    async saveRepositorySettings() {
        console.log("saveRepositorySettings", this.state.repositorySettings);

        this.dataSource.setRepositorySettings(this.state.repositorySettings);
    }


    async chooseRepositoryFolder() {
        let repositoryChoosenOK = await this.dataSource.chooseRepositoryFolder();
        console.log("chooseRepositoryFolder", repositoryChoosenOK);

        let repositorySettings = {};
        if (repositoryChoosenOK) {
            repositorySettings = await this.getRepositorySettings();
        }

        this.setState({
            isRepositoryInitialized: repositoryChoosenOK,
            repositorySettings: repositorySettings,
        });
    }

    async handleClickRepository(repositoryFolder) {
        let repositoryChanged = await this.dataSource.changeRepository(repositoryFolder);
        console.log("handleClickRepository", repositoryChanged);

        let repositorySettings = {};
        if (repositoryChanged) {
            repositorySettings = await this.getRepositorySettings();
        }

        this.setState({
            isRepositoryInitialized: repositoryChanged,
            repositorySettings: repositorySettings,
            childNotes: undefined,
            detailsNote: undefined,
            activeNoteKey: undefined,
            activeNote: undefined,
        });
    }



    async reloadChildNotes(key, setTaskOnly, setNoteOnly, setDone, setNotDone) {
        let types = [];
        if (!this.state.repositorySettings.filterOnlyTasks && setTaskOnly) {
            types.push("'task'");
        } else if (this.state.repositorySettings.filterOnlyTasks && !setTaskOnly && !setNoteOnly) {
            types.push("'task'");
        } else if (!this.state.repositorySettings.filterOnlyNotes && setNoteOnly) {
            types.push("'note'");
        } else if (this.state.repositorySettings.filterOnlyNotes && !setNoteOnly && !setTaskOnly) {
            types.push("'note'");
        }


        let dones = [];
        if (!this.state.repositorySettings.filterOnlyDone && setDone) {
            dones.push(1);
        } else if (this.state.repositorySettings.filterOnlyDone && !setDone && !setNotDone) {
            dones.push(1);
        } else if (!this.state.repositorySettings.filterOnlyNotDone && setNotDone) {
            dones.push(0);
        } else if (this.state.repositorySettings.filterOnlyNotDone && !setNotDone && !setDone) {
            dones.push(0);
        }
        let childNotes = await this.dataSource.search("", -1, this.state.trash, {
            parentNotesKey: [key],
            types: types.length == 0 ? ["'note'", "'task'"] : types,
            dones: dones.length == 0 ? [0, 1] : dones,
            sortBy: "priority desc"
        });

        this.setState((previousState) => {
            return {
                childNotes: childNotes,
            }
        });
    }

    async setFilterOnlyTasks() {
        this.setState((previousState) => {

            let prevFilterOnlyTasks = previousState.repositorySettings.filterOnlyTasks;
            let prevFilterOnlyNotes = previousState.repositorySettings.filterOnlyNotes;

            let repositorySettings = {...previousState.repositorySettings, ...{
                filterOnlyTasks: (!prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                                    (prevFilterOnlyTasks && !prevFilterOnlyNotes) ? false : (
                                        (!prevFilterOnlyTasks && prevFilterOnlyNotes) ? true : false)), 
                filterOnlyNotes: false, 
            }};

            return {
                repositorySettings: repositorySettings
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey, true, false);

        this.saveRepositorySettings();
    }

    async setFilterOnlyNotes() {
        this.setState((previousState) => {

            let prevFilterOnlyTasks = previousState.repositorySettings.filterOnlyTasks;
            let prevFilterOnlyNotes = previousState.repositorySettings.filterOnlyNotes;

            let repositorySettings = {...previousState.repositorySettings, ...{
                filterOnlyTasks: false, 
                filterOnlyNotes: (!prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                    (prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                        (!prevFilterOnlyTasks && prevFilterOnlyNotes) ? false : false)),    
            }};

            return {
                repositorySettings: repositorySettings
            }
        });

        await this.reloadChildNotes(this.state.activeNoteKey,false, true);

        this.saveRepositorySettings();
    }

    async setFilterOnlyDone() {
        this.setState((previousState) => {

            let prevFilterOnlyDone = previousState.repositorySettings.filterOnlyDone;
            let prevFilterOnlyNotDone = previousState.repositorySettings.filterOnlyNotDone;

            let repositorySettings = {...previousState.repositorySettings, ...{
                filterOnlyDone: (!prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                                    (prevFilterOnlyDone && !prevFilterOnlyNotDone) ? false : (
                                        (!prevFilterOnlyDone && prevFilterOnlyNotDone) ? true : false)), 
                filterOnlyNotDone: false, 
            }};

            return {
                repositorySettings: repositorySettings
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, true, false);

        this.saveRepositorySettings();
    }

    async setFilterOnlyNotDone() {
        this.setState((previousState) => {

            let prevFilterOnlyDone = previousState.repositorySettings.filterOnlyDone;
            let prevFilterOnlyNotDone = previousState.repositorySettings.filterOnlyNotDone;

            let repositorySettings = {...previousState.repositorySettings, ...{
                filterOnlyDone: false, 
                filterOnlyNotDone: (!prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                    (prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                        (!prevFilterOnlyDone && prevFilterOnlyNotDone) ? false : false)),    
            }};

            return {
                repositorySettings: repositorySettings
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, false, true);
        this.saveRepositorySettings();
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

            return node;
        }
    
    }

    async addNote(key) {
        // console.log("addNote");
        key = key || this.state.activeNoteKey;
        let newNote = await this.fancyTreeDomRef.current.addNote(key);
        this.activateNote(newNote.key);
        return newNote;
    }

    async openNoteInTree(key) {
        // console.log("openNoteInTree", key);

        let detailsNoteParents = await this.dataSource.getParents(key);

        // console.log("openNoteInTree, detailsNoteParents=", detailsNoteParents);

        await this.fancyTreeDomRef.current.openNotes(detailsNoteParents);
        // console.log(">>>>>>>>>>>>>>>> openNoteInTree NOW  activateNote");

        this.activateNote(key);

    }


    async openNoteDetails(noteKey) {

        if (noteKey) {

            let detailsNote = await this.dataSource.getNote(noteKey);
            let detailsNoteParents = await this.dataSource.getParents(noteKey);
            let detailsNoteBacklinks = await this.dataSource.getBacklinks(noteKey);

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

    async expandNote(key, expanded) {
        let modifiedNote = await this.dataSource.modifyNote({
            key: key, 
            expanded: expanded	
        });
    }

    async activateNote(noteKey) {
        if (noteKey) {

            let detailsNote = await this.dataSource.getNote(noteKey);
            this.fancyTreeDomRef.current.setNote(detailsNote);
            this.fancyTreeDomRef.current.setActive(noteKey);
            let detailsNoteParents = await this.dataSource.getParents(noteKey);
            let detailsNoteBacklinks = await this.dataSource.getBacklinks(noteKey);
            
            detailsNote.parents = detailsNoteParents;
            detailsNote.backlinks = detailsNoteBacklinks;

            this.setState({
                detailsNote: detailsNote,
                activeNoteKey: detailsNote.key,
                activeNote: detailsNote,
            });
            await this.reloadChildNotes(detailsNote.key, false, false, false, false);
            
        } else {
            this.fancyTreeDomRef.current.deactiveNote();
            this.setState({
                detailsNote: undefined,
                activeNoteKey: undefined,
                activeNote: undefined,
                childNotes: undefined,
            });
        }

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
                if (previousState.detailsNote) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.description = modifiedNote.description;
                    newState.detailsNote = note;
                }

                return newState;
            }
        });

    }

    async handleChangeTitle(noteKey, title) {
        title = title.replaceAll("/", "");
        this.setState((previousState) => {
            if (previousState.detailsNote || previousState.childNotes) {
                let newState = {}
                if (previousState.detailsNote) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.title = title;
                    if (note.parents) {
                        note.parents[note.parents.length - 1].title = title;
                    }
                    newState.detailsNote = note;
                }

                if (previousState.childNotes) {
                    const newChildNotes = previousState.childNotes.map((note) => {
                        if (note.key === noteKey) {
                            note = JSON.parse(JSON.stringify(note));
                            note.title = title;
                        }
                        return note;
                    });
                    newState.childNotes = newChildNotes;
                }
                return newState;
            }
        });
        this.fancyTreeDomRef.current.setTitle(noteKey, title);
        
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            title: title	
        });

    }

    // from Tree
    async selectNote(noteKey, done) {
        this.setState((previousState) => {
            if (previousState.detailsNote) {
                let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                note.done = done;
                return {
                    detailsNote: note,
                };
            }
        });

        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            done: done	
        });
    }
    
    // from details or list
    async handleChangeDone(noteKey, done, fromTree) {
        this.setState((previousState) => {
            if (previousState.detailsNote || previousState.childNotes) {
                let newState = {}
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.done = done;
                    newState.detailsNote = note;
                }
/*
                if (previousState.childNotes) {
                    const newChildNotes = previousState.childNotes.map((note) => {
                        if (note.key === noteKey) {
                            note = JSON.parse(JSON.stringify(note));
                            note.done = done;
                        }
                        return note;
                    });
                    newState.childNotes = newChildNotes;
                }
*/
                return newState;
            }
        });

        if (!fromTree) {
            this.fancyTreeDomRef.current.setDone(noteKey, done);
        }
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            done: done	
        });

        await this.reloadChildNotes(this.state.activeNoteKey, false, false, false, false);
    }

    async handleChangeType(noteKey, type) {
        this.setState((previousState) => {
            if (previousState.detailsNote || previousState.childNotes) {
                let newState = {}
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.type = type;
                    newState.detailsNote = note;
                }

                if (previousState.childNotes) {
                    const newChildNotes = previousState.childNotes.map((note) => {
                        if (note.key === noteKey) {
                            note = JSON.parse(JSON.stringify(note));
                            note.type = type;
                        }
                        return note;
                    });
                    newState.childNotes = newChildNotes;
                }
                return newState;
            }
        });

        this.fancyTreeDomRef.current.setType(noteKey, type);
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            type: type	
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, false, false);
    }

    async handleChangePriority(noteKey, priority) {
        this.setState((previousState) => {
            if (previousState.detailsNote || previousState.childNotes) {
                let newState = {}
                if (previousState.detailsNote && previousState.detailsNote.key == noteKey) {
                    let note = JSON.parse(JSON.stringify(previousState.detailsNote));
                    note.priority = priority;
                    newState.detailsNote = note;
                }

                if (previousState.childNotes) {
                    const newChildNotes = previousState.childNotes.map((note) => {
                        if (note.key === noteKey) {
                            note = JSON.parse(JSON.stringify(note));
                            note.priority = priority;
                        }
                        return note;
                    });
                    newState.childNotes = newChildNotes;
                }
                return newState;
            }
        });

        this.fancyTreeDomRef.current.setPriority(noteKey, priority);
        await this.dataSource.modifyNote({
            key: noteKey, 
            priority: priority	
        });

        let self = this;
        this.dataSource.getPriorityStat().then(function(priorityStat) {
            self.setState({
                priorityStat: priorityStat
            });
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, false, false);
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
            console.log("TODO: in trash remove permanently");

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
                
                childNotes: undefined,
                detailsNote: undefined,
                activeNoteKey: undefined,
                activeNote: undefined,
            });

            await this.fancyTreeDomRef.current.reload(note.parent);

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
            childNotes: undefined,
            detailsNote: undefined,
            activeNoteKey: undefined,
            activeNote: undefined,
        }, () => { 
            this.fancyTreeDomRef.current.reload(note.parent);
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

            childNotes: undefined,
            detailsNote: undefined,
            activeNoteKey: undefined,
            activeNote: undefined,
        }, () => { 
            console.log("openTrash new state", this.state.trash);
            this.fancyTreeDomRef.current.reload(note.parent);
        });
        
    }

    async openTrash() {
        console.log("openTrash", this.state.trash);

        this.setState((previousState) => {
            console.log("openTrash previousState", previousState);
            return {
                trash: !previousState.trash,
                childNotes: undefined,
                detailsNote: undefined,
                activeNoteKey: undefined,
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
                            <Button
                                onClick={(event)=> this.chooseRepositoryFolder()}
                            >Add Repository Folder</Button>
                        </div>
                    </div> 
                    :
                    <ReflexContainer orientation="vertical">
                
                        <ReflexElement className="left-bar"
                            minSize="200"
                            flex={0.25}>
                            <div className='n3-bar-vertical'>
                                <div className={`nn-header ${this.state.trash ? "nn-trash-background-color" : ""}`}>

                                    {
                                        !this.state.trash && 
                                        <Space>
                                            <Button
                                                onClick={(event)=> this.addNote()}
                                            ><PlusOutlined /> Add note </Button>
                                        </Space>
                                    }
                                        
                                </div>
                                <FancyTree
                                    ref={this.fancyTreeDomRef}
                                    loadTree={this.loadTree} 
                                    delete={this.delete}
                                    restore={this.restore}
                                    activateNote={this.activateNote}
                                    addNote={this.addNote}
                                    expandNote={this.expandNote}
                                    handleChangeDone={this.handleChangeDone} 
                                    dataSource={this.dataSource}
                                    trash={this.state.trash}
                                    
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
                                        dataSource={this.dataSource}
                                        openNoteInTree={this.openNoteInTree}
                                    />
                                    
                                </div>

                                <Note 
                                    dataSource={this.dataSource}

                                    noteTypes={noteTypes}
                                    getNoteTypeLabel={this.getNoteTypeLabel}
                                    getOtherNoteTypeLabel={this.getOtherNoteTypeLabel}
                                    priorityStat={this.state.priorityStat}

                                    note={this.state.detailsNote} 

                                    handleChangeDone={this.handleChangeDone} 
                                    handleChangeType={this.handleChangeType} 
                                    handleChangeTitle={this.handleChangeTitle}
                                    
                                    handleChangeDescription={this.handleChangeDescription}
                                    handleChangePriority={this.handleChangePriority}

                                    
                                    addNote={this.addNote}
                                    addTag={this.addTag}
                                    deleteTag={this.deleteTag}
                                    openNoteDetails={this.openNoteDetails}
                                    activateNote={this.activateNote} 
                                    openNoteInTree={this.openNoteInTree}
                                    delete={this.delete}
                                    restore={this.restore}
                                />
                            </div>
                        </ReflexElement>

                        <ReflexSplitter propagate={true}/>

                        <ReflexElement minSize="200" flex={0.25}>
                            <NotesList 
                                ref={this.simpleListDomRef}

                                note={this.state.activeNote} 
                                notes={this.state.childNotes}

                                trash={this.state.trash}

                                dataSource={this.dataSource}
                                noteTypes={noteTypes}
                                handleChangeDone={this.handleChangeDone} 
                                handleChangeType={this.handleChangeType} 
                                handleChangePriority={this.handleChangePriority}

                                openNoteDetails={this.openNoteDetails} 
                                activateNote={this.activateNote} 

                                setFilterOnlyTasks={this.setFilterOnlyTasks}
                                setFilterOnlyNotes={this.setFilterOnlyNotes}

                                setFilterOnlyDone={this.setFilterOnlyDone}
                                setFilterOnlyNotDone={this.setFilterOnlyNotDone}

                                repositorySettings={this.state.repositorySettings}

                                
                                getNoteTypeLabel={this.getNoteTypeLabel}
                            />
                        </ReflexElement>
                                    
                    </ReflexContainer>
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