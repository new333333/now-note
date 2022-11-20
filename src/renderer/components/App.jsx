import React from 'react';

import { ApartmentOutlined, UserOutlined , BarsOutlin1ed, NodeExpandOutlined, PlusOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Input, Space, Button, List, AutoComplete } from 'antd';
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




class App extends React.Component {

    constructor() {
        super();
        this.dataSource = window.electronAPI;

        this.state = {
            activeNoteKey: undefined,
            activeNote: undefined,
            detailsNote: undefined,
            filterByParentNotesKey: [],
            filterOnlyTasks: false,
            filterOnlyNotes: false,
            childNotes: undefined,
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
    }

    async initialRepository() {

        let priorityStat = await this.dataSource.getPriorityStat();
        this.setState({
            priorityStat: priorityStat
        });

        let isRepositoryInitialized = await this.dataSource.isRepositoryInitialized();
        console.log("isRepositoryInitialized", isRepositoryInitialized);

        this.setState({
            isRepositoryInitialized: isRepositoryInitialized
        });

        if (isRepositoryInitialized) {
            let repositorySettings = await this.dataSource.getRepositorySettings();
            console.log("repositorySettings", repositorySettings);

            if (repositorySettings) {
                this.setState(repositorySettings);
            }

        }

        let repositories = this.dataSource.getRepositories();
        this.setState({
            repositories: repositories
        });
    }

    async setRepositorySettings(settings) {
        console.log("setRepositorySettings", settings);

        this.dataSource.setRepositorySettings(settings);
    }


    async chooseRepositoryFolder() {
        let self = this;
        this.dataSource.chooseRepositoryFolder().then(function(repository) {
            console.log("chooseRepositoryFolder", repository);

            self.setState({
                isRepositoryInitialized: repository !== undefined,
            });
        });
    }

    async handleClickRepository(repositoryFolder) {
        let self = this;
        this.dataSource.changeRepository(repositoryFolder).then(function(repositoryChanged) {
            console.log("chooseRepositoryFolder", repositoryChanged);

            self.setState({
                isRepositoryInitialized: repositoryChanged,
                childNotes: undefined,
                detailsNote: undefined,
                activeNoteKey: undefined,
                activeNote: undefined,
            });
        });
    }



    async reloadChildNotes(key, setTaskOnly, setNoteOnly, setDone, setNotDone) {
        let types = [];
        if (!this.state.filterOnlyTasks && setTaskOnly) {
            types.push("'task'");
        } else if (this.state.filterOnlyTasks && !setTaskOnly && !setNoteOnly) {
            types.push("'task'");
        } else if (!this.state.filterOnlyNotes && setNoteOnly) {
            types.push("'note'");
        } else if (this.state.filterOnlyNotes && !setNoteOnly && !setTaskOnly) {
            types.push("'note'");
        }


        let dones = [];
        if (!this.state.filterOnlyDone && setDone) {
            dones.push(1);
        } else if (this.state.filterOnlyDone && !setDone && !setNotDone) {
            dones.push(1);
        } else if (!this.state.filterOnlyNotDone && setNotDone) {
            dones.push(0);
        } else if (this.state.filterOnlyNotDone && !setNotDone && !setDone) {
            dones.push(0);
        }

        let childNotes = await this.dataSource.search("", -1, false, {
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
            return {
                filterOnlyTasks: (!previousState.filterOnlyTasks && !previousState.filterOnlyNotes) ? true : (
                                    (previousState.filterOnlyTasks && !previousState.filterOnlyNotes) ? false : (
                                        (!previousState.filterOnlyTasks && previousState.filterOnlyNotes) ? true : false)), 
                filterOnlyNotes: false, 
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey, true, false);

        this.setRepositorySettings({
            filterOnlyNotes: this.state.filterOnlyNotes,
            filterOnlyTasks: this.state.filterOnlyTasks,
        });
    }

    async setFilterOnlyNotes() {
        this.setState((previousState) => {
            return {
                filterOnlyTasks: false, 
                filterOnlyNotes: (!previousState.filterOnlyTasks && !previousState.filterOnlyNotes) ? true : (
                    (previousState.filterOnlyTasks && !previousState.filterOnlyNotes) ? true : (
                        (!previousState.filterOnlyTasks && previousState.filterOnlyNotes) ? false : false)),    
            }
        });

        await this.reloadChildNotes(this.state.activeNoteKey,false, true);

        this.setRepositorySettings({
            filterOnlyNotes: this.state.filterOnlyNotes,
            filterOnlyTasks: this.state.filterOnlyTasks
        });
    }

    async setFilterOnlyDone() {
        this.setState((previousState) => {
            return {
                filterOnlyDone: (!previousState.filterOnlyDone && !previousState.filterOnlyNotDone) ? true : (
                                    (previousState.filterOnlyDone && !previousState.filterOnlyNotDone) ? false : (
                                        (!previousState.filterOnlyDone && previousState.filterOnlyNotDone) ? true : false)), 
                filterOnlyNotDone: false, 
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, true, false);

        this.setRepositorySettings({
            filterOnlyDone: this.state.filterOnlyDone,
            filterOnlyNotDone: this.state.filterOnlyNotDone
        });
    }

    async setFilterOnlyNotDone() {
        this.setState((previousState) => {
            return {
                filterOnlyDone: false, 
                filterOnlyNotDone: (!previousState.filterOnlyDone && !previousState.filterOnlyNotDone) ? true : (
                    (previousState.filterOnlyDone && !previousState.filterOnlyNotDone) ? true : (
                        (!previousState.filterOnlyDone && previousState.filterOnlyNotDone) ? false : false)),    
            }
        });
        await this.reloadChildNotes(this.state.activeNoteKey,false, false, false, true);
        this.setRepositorySettings({
            filterOnlyDone: this.state.filterOnlyDone,
            filterOnlyNotDone: this.state.filterOnlyNotDone
        });
    }

    loadTree(key, data) {
        let self = this;

        if (key.type == 'source') {

            return this.dataSource.getChildren().then(function(rootNodes) {
                rootNodes = self.mapToTreeData(rootNodes);

                // console.log("loadTree, rootNodes=", rootNodes);


                return rootNodes;
            });
          

        } else if (data.node) {

            data.result = this.dataSource.getChildren(data.node.key).then(function(children) {
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
    

    render() {

        const renderTitle = (title) => (
            <span>
              {title}
              <a
                style={{
                  float: 'right',
                }}
                href="https://www.google.com/search?q=antd"
                target="_blank"
                rel="noopener noreferrer"
              >
                more
              </a>
            </span>
          );
          const renderItem = (title, count) => ({
            value: title,
            label: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                {title}
                <span>
                  <UserOutlined /> {count}
                </span>
              </div>
            ),
          });
          const options = [
            {
              label: renderTitle('Libraries'),
              options: [renderItem('AntDesign', 10000), renderItem('AntDesign UI', 10600)],
            },
            {
              label: renderTitle('Solutions'),
              options: [renderItem('AntDesign UI FAQ', 60100), renderItem('AntDesign FAQ', 30010)],
            },
            {
              label: renderTitle('Articles'),
              options: [renderItem('AntDesign design language', 100000)],
            },
          ];


        return (

            <>
            {
            
                !this.state.isRepositoryInitialized ? 
                <div className='nn-center-screen'>
                    <div style={{margin: "10px 100px"}}>
                        <List
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
                        />
                    </div>
                    <div className="nn-flex-break"></div>
                    <div>
                        <Button
                            onClick={(event)=> this.chooseRepositoryFolder()}
                        >Choose Repository Folder</Button>
                    </div>
                </div> 
                :
                <ReflexContainer orientation="vertical">
            
                    <ReflexElement className="left-bar"
                        minSize="200"
                        flex={0.25}>
                        <div className='n3-bar-vertical'>
                            <div className="nn-header">
                                <Space>
                                    <Button
                                        onClick={(event)=> this.addNote()}
                                    ><PlusOutlined /> Add note </Button>
                                </Space>
                                    
                            </div>
                            <FancyTree
                                ref={this.fancyTreeDomRef}
                                name="new333" 
                                loadTree={this.loadTree} 
                                activateNote={this.activateNote}
                                expandNote={this.expandNote}
                                handleChangeDone={this.handleChangeDone} 
                                dataSource={this.dataSource}
                                />
                        </div>
                    </ReflexElement>

            
                    <ReflexSplitter propagate={true}/>
            
                    <ReflexElement className="right-bar"
                        minSize="200"
                        flex={0.5}>
                        <div className='n3-bar-vertical'>
                            <div className="nn-header">
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
                            />
                        </div>
                    </ReflexElement>

                    <ReflexSplitter propagate={true}/>

                    <ReflexElement minSize="200" flex={0.25}>
                        <NotesList 
                            ref={this.simpleListDomRef}

                            note={this.state.activeNote} 
                            notes={this.state.childNotes}

                            dataSource={this.dataSource}
                            noteTypes={noteTypes}
                            handleChangeDone={this.handleChangeDone} 
                            handleChangeType={this.handleChangeType} 
                            handleChangePriority={this.handleChangePriority}

                            openNoteDetails={this.openNoteDetails} 
                            activateNote={this.activateNote} 

                            setFilterOnlyTasks={this.setFilterOnlyTasks}
                            filterOnlyTasks={this.state.filterOnlyTasks}
                            setFilterOnlyNotes={this.setFilterOnlyNotes}
                            filterOnlyNotes={this.state.filterOnlyNotes}

                            setFilterOnlyDone={this.setFilterOnlyDone}
                            filterOnlyDone={this.state.filterOnlyDone}
                            setFilterOnlyNotDone={this.setFilterOnlyNotDone}
                            filterOnlyNotDone={this.state.filterOnlyNotDone}

                            
                            getNoteTypeLabel={this.getNoteTypeLabel}
                        />
                    </ReflexElement>
                                
                </ReflexContainer>
            }
            </>
        )
    }
}

export {App};