import React from 'react';

import { ApartmentOutlined, BarsOutlin1ed, NodeExpandOutlined, PlusOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Input, Space, Button } from 'antd';
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
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
const dayjs = require('dayjs')

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
            listView: "tree",
            activeNoteKey: undefined,
            title: "",
            description: "",
            done: false,
            type: "note",
            priority: 0,
            tags: [],
            childNotes: [],
            filterByParentNotesKey: [],
        };
        this.loadTree = this.loadTree.bind(this);
        this.activateNote = this.activateNote.bind(this);
        this.selectNote = this.selectNote.bind(this);
        this.setDone = this.setDone.bind(this);
        this.setType = this.setType.bind(this);
        this.setTitle = this.setTitle.bind(this);
        this.setDescription = this.setDescription.bind(this);
        this.setPriority = this.setPriority.bind(this);
        this.addTag = this.addTag.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
        this.handleChangeTitle = this.handleChangeTitle.bind(this);
        this.getNoteTypeLabel = this.getNoteTypeLabel.bind(this);
        this.getOtherNoteTypeLabel = this.getOtherNoteTypeLabel.bind(this);
        this.addNote = this.addNote.bind(this);
        this.setFilterByParentNotesKey = this.setFilterByParentNotesKey.bind(this);

        this.fancyTreeDomRef = React.createRef();
        this.simpleListDomRef = React.createRef();

        let self = this;
        this.dataSource.getPriorityStat().then(function(priorityStat) {
            self.setState({
                priorityStat: priorityStat
            });
        });

    }
    
    async findNotes() {
        return await this.dataSource.findNotes();
    }

    setFilterByParentNotesKey(keys) {
        console.log("setFilterByParentNotesKey keys", keys);
        this.setState({
            filterByParentNotesKey: keys
        });
    }

    loadTree(key, data) {
        let self = this;

        if (key.type == 'source') {

            return this.dataSource.getChildren().then(function(rootNodes) {
                rootNodes = self.mapToTreeData(rootNodes);
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

    setNotesListView(listViewtype, event) {
        this.setState({
            listView: listViewtype
        });
    }

    addNote() {
        console.log("addNote");

        let newNoteData = {
            checkbox: false,
            title: dayjs().format("DD.MM.YYYY HH:mm"),
            type: "note",
            priority: 0,
            done: false,
            expanded: false
        };

        if (this.state.listView != "simpleList") {
            this.fancyTreeDomRef.current.addNote(this.state.activeNoteKey, newNoteData);
        }
    }

    async activateNote(noteKey) {

        if (noteKey) {

            let note = await this.dataSource.getNote(noteKey);
            if (this.state.listView == "simpleList") {

                this.simpleListDomRef.current.setActive(noteKey);

                let parents = await this.dataSource.getParents(noteKey);
                let backlinks = await this.dataSource.getBacklinks(noteKey);
                let childNotes = await this.dataSource.search("", -1, false, {parentNotesKey: [noteKey]});

                this.setState({
                    activeNoteKey: note.key,
                    title: note.title,
                    description: note.description,
                    done: note.done,
                    type: note.type,
                    priority: note.priority,
                    tags: note.tags,
                    parents: parents,
                    backlinks: backlinks,
                    childNotes: childNotes,
                });


            } else {
                this.fancyTreeDomRef.current.setNote(note);
                note = this.fancyTreeDomRef.current.setActive(noteKey);
                let parents = await this.dataSource.getParents(noteKey);
                let backlinks = await this.dataSource.getBacklinks(noteKey);
                let childNotes = await this.dataSource.search("", -1, false, {parentNotesKey: [noteKey]});

                this.setState({
                    activeNoteKey: note.key,
                    title: note.title,
                    description: note.data.description,
                    done: note.data.done,
                    type: note.data.type,
                    priority: note.data.priority,
                    tags: note.data.tags,
                    parents: parents,
                    backlinks: backlinks,
                    childNotes: childNotes,
                });
            }

        } else {
            if (this.state.listView == "simpleList") {

                this.simpleListDomRef.current.setActive(undefined);
                this.setState({
                    activeNoteKey: undefined,
                    title: undefined,
                    description: undefined,
                    done: undefined,
                    type: undefined,
                    priority: undefined,
                    tags: undefined,
                    parents: undefined,
                    backlinks: undefined
                });

            } else {
                this.fancyTreeDomRef.current.deactiveNote();
                this.setState({
                    activeNoteKey: undefined,
                    title: undefined,
                    description: undefined,
                    done: undefined,
                    type: undefined,
                    priority: undefined,
                    tags: undefined,
                    parents: undefined,
                    backlinks: undefined
                });
            }
        }

    }

    async setDescription(noteKey, description) {
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            description: description	
        });
    }

    async setTitle(noteKey, title) {
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            title: title	
        });
        let parents = await this.dataSource.getParents(noteKey);
        this.setState({
            parents: parents,
        });
    }

    handleChangeTitle(noteKey, title) {
        this.fancyTreeDomRef.current.setTitle(noteKey, title);

        this.setState({
            title: title,
        });

        this.setState((previousState) => {
            let parents = JSON.parse(JSON.stringify(previousState.parents));
            if (parents) {
                parents[parents.length - 1].title = title;
                return {
                    parents: parents,
                };
            }
        });
    }

    async selectNote(noteKey, done) {
        this.setState({
            done: done,
        });
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            done: done	
        });
    }
    
    async setDone(noteKey, done) {
        this.setState({
            done: done,
        });
        this.fancyTreeDomRef.current.setDone(noteKey, done);
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            done: done	
        });
    }

    async setType(noteKey, type) {
        this.setState({
            type: type,
        });
        this.fancyTreeDomRef.current.setType(noteKey, type);
        let modifiedNote = await this.dataSource.modifyNote({
            key: noteKey, 
            type: type	
        });
    }

    async setPriority(noteKey, priority) {
        this.setState({
            priority: priority,
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
        this.setState({
            tags: tags
        });
    }

    async deleteTag(noteKey, tag) {
        let tags = await this.dataSource.removeTag(noteKey, tag);
        this.fancyTreeDomRef.current.setTags(noteKey, tags);
        this.setState({
            tags: tags
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

        let listView = <FancyTree
                            ref={this.fancyTreeDomRef}
                            name="new333" 
                            loadTree={this.loadTree} 
                            activateNote={this.activateNote} 
                            selectNote={this.selectNote} 
                            dataSource={this.dataSource}
                            />;
        if (this.state.listView == "simpleList") {
            listView = <NotesList 
                            ref={this.simpleListDomRef}

                            dataSource={this.dataSource}

                            findNotes={this.findNotes}  
                            activateNote={this.activateNote} 
                            setFilterByParentNotesKey={this.setFilterByParentNotesKey}
                            filterByParentNotesKey={this.state.filterByParentNotesKey}
                        />;
        }

        return (
            <ReflexContainer orientation="vertical">
        
                <ReflexElement className="left-bar"
                    minSize="200"
                    flex={0.25}>
                    <div className='n3-bar-vertical'>
                        <div>
                            <Space>
                                {/*
                                    <Button
                                        icon={<ApartmentOutlined />}
                                        onClick={(event)=> this.setNotesListView("tree", event)}
                                    />

                                    <Button
                                        icon={<BarsOutlined />}
                                        onClick={(event)=> this.setNotesListView("simpleList", event)}
                                    />
                                */}

                                <Button
                                    onClick={(event)=> this.addNote()}
                                ><PlusOutlined /> Add note </Button>
                            </Space>
                                
                        </div>
                        {listView}
                    </div>
                </ReflexElement>

                <ReflexSplitter propagate={true}/>

                <ReflexElement minSize="200"
                    flex={0.25}>
                    <NotesList 
                        ref={this.simpleListDomRef}

                        dataSource={this.dataSource}

                        findNotes={this.findNotes}  
                        activateNote={this.activateNote} 
                        setFilterByParentNotesKey={this.setFilterByParentNotesKey}
                        notes={this.state.childNotes}
                        getNoteTypeLabel={this.getNoteTypeLabel}
                    />
                </ReflexElement>
        
                <ReflexSplitter propagate={true}/>
        
                <ReflexElement className="right-bar"
                    minSize="200"
                    flex={0.5}>
                    <Note 
                        dataSource={this.dataSource}

                        noteTypes={noteTypes}
                        getNoteTypeLabel={this.getNoteTypeLabel}
                        getOtherNoteTypeLabel={this.getOtherNoteTypeLabel}
                        priorityStat={this.state.priorityStat}

                        noteKey={this.state.activeNoteKey} 
                        title={this.state.title} 
                        done={this.state.done} 
                        type={this.state.type}
                        priority={this.state.priority}
                        description={this.state.description || ""}
                        backlinks={this.state.backlinks}
                        parents={this.state.parents} 

                        setDone={this.setDone} 
                        setType={this.setType} 
                        setTitle={this.setTitle}
                        handleChangeTitle={this.handleChangeTitle}
                        
                        setDescription={this.setDescription}
                        setPriority={this.setPriority}

                        tags={this.state.tags}
                        addTag={this.addTag}
                        deleteTag={this.deleteTag}
                        activateNote={this.activateNote}

                        setFilterByParentNotesKey={this.setFilterByParentNotesKey}
                    />
                </ReflexElement>
        
            </ReflexContainer>
        )
    }
}

export {App};