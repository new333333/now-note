import React from 'react';

import { ApartmentOutlined, BarsOutlined, NodeExpandOutlined } from '@ant-design/icons';
import { Input, Space } from 'antd';
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
        this.state = {
            listView: "tree",
        };
        this.loadTree = this.loadTree.bind(this);
        this.activateNote = this.activateNote.bind(this);
        this.selectNote = this.selectNote.bind(this);
        this.setDone = this.setDone.bind(this);
        this.setType = this.setType.bind(this);
        this.setTitle = this.setTitle.bind(this);
        this.setPriority = this.setPriority.bind(this);
        this.addTag = this.addTag.bind(this);
        this.handleChangeTitle = this.handleChangeTitle.bind(this);
        this.handleChangePriority = this.handleChangePriority.bind(this);


        let self = this;
        window.electronAPI.getPriorityStat().then(function(priorityStat) {
            self.setState({
                priority: priorityStat
            });
        });

    }
    
    loadTree(key, data) {
        let self = this;

        if (key.type == 'source') {

            return window.electronAPI.getChildren().then(function(rootNodes) {
                rootNodes = self.mapToTreeData(rootNodes);
                return rootNodes;
            });
          

        } else if (data.node) {

            data.result = window.electronAPI.getChildren(data.node.key).then(function(children) {
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
        console.log("setNotesListView", listViewtype);

        this.setState({
            listView: listViewtype
        });
    }

    async activateNote(noteKey) {
        console.log();
        let self = this;
        let note = await window.electronAPI.getNote(noteKey);
        console.log("activateNote", note);
        let parents = await window.electronAPI.getParents(noteKey);
        this.setState({
            activeNote: note,
            parents: parents,
        });
    }

    async selectNote(noteKey, done) {

        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            done: done	
        });

        if (modifiedNote.key == this.state.activeNote.key) {
            this.setState({
                activeNote: modifiedNote,
            });
        }

    }
    
    async setDone() {
        let activeNoteKey = this.state.activeNote.key;
        let modifiedNote = await window.electronAPI.modifyNote({
            key: activeNoteKey, 
            done: !this.state.activeNote.done	
        });
        if (activeNoteKey == this.state.activeNote.key) {
            this.setState(prevState => {
                let activeNote = Object.assign({}, prevState.activeNote);
                activeNote.done = modifiedNote.done;             
                return { activeNote };
            });
        }
    }

    async setType(type) {
        let activeNoteKey = this.state.activeNote.key;
        let modifiedNote = await window.electronAPI.modifyNote({
            key: activeNoteKey, 
            type: type	
        });

        if (activeNoteKey == this.state.activeNote.key) {
            this.setState(prevState => {
                let activeNote = Object.assign({}, prevState.activeNote);
                activeNote.type = type;             
                return { activeNote };
            });
        }
    }

    async setTitle(title) {
        let activeNoteKey = this.state.activeNote.key;
        let modifiedNote = await window.electronAPI.modifyNote({
            key: activeNoteKey, 
            title: title	
        });

        if (activeNoteKey == this.state.activeNote.key) {
            this.setState(prevState => {
                let activeNote = Object.assign({}, prevState.activeNote);
                activeNote.title = title;             
                return { activeNote };
            });
        }
    }

    async setPriority(priority) {
        let activeNoteKey = this.state.activeNote.key;
        let modifiedNote = await window.electronAPI.modifyNote({
            key: activeNoteKey, 
            priority: priority	
        });

        if (activeNoteKey == this.state.activeNote.key) {
            this.setState(prevState => {
                let activeNote = Object.assign({}, prevState.activeNote);
                activeNote.priority = priority;             
                return { activeNote };
            });
        }
/*
        let priorityStat = await window.electronAPI.getPriorityStat();
        this.setState({
            priority: priorityStat
        });
    */    
    }

    async addTag(tag) {
        let activeNoteKey = this.state.activeNote.key;

        let tags = await window.electronAPI.addTag(activeNoteKey, tag);

        console.log("addTag tags", tags);

        this.setState(prevState => {
            let activeNote = Object.assign({}, prevState.activeNote);
            activeNote.tags = tags;             
            return { activeNote };
        });
    }

    handleChangeTitle(val) {
        this.setState(prevState => {
            let activeNote = Object.assign({}, prevState.activeNote);  // creating copy of state variable jasper
            activeNote.title = val;                     // update the name property, assign a new value                 
            return { activeNote };                                 // return new object jasper object
        });
    }

    handleChangePriority(val) {
        this.setState(prevState => {
            let activeNote = Object.assign({}, prevState.activeNote);  // creating copy of state variable jasper
            activeNote.priority = val;                     // update the name property, assign a new value                 
            return { activeNote };                                 // return new object jasper object
        });
    }

    render() {

        console.log("App render this.state.activeNote", this.state.activeNote);


        let listView = <FancyTree name="new333" 
                            loadTree={this.loadTree} 
                            activeNote={this.state.activeNote} 
                            activateNote={this.activateNote} 
                            selectNote={this.selectNote} 
                            />;
        if (this.state.listView == "simpleList") {
            listView = <NotesList />;
        }

        return (
            <ReflexContainer orientation="horizontal">

                <ReflexElement  minSize="50" maxSize="50">
                    <NoteBreadCrumb note={this.state.activeNote} parents={this.state.parents} activateNote={this.activateNote} />
                </ReflexElement>

                <ReflexElement>

                    <ReflexContainer orientation="vertical">
                
                        <ReflexElement className="left-bar"
                            minSize="200"
                            flex={0.5}>
                            <div className='n3-bar-vertical'>
                                <div>
                                    <Space>
                                        <ApartmentOutlined onClick={(event)=> this.setNotesListView("tree", event)} />
                                        <BarsOutlined onClick={(event)=> this.setNotesListView("simpleList", event)} />
                                    </Space>
                                </div>
                                {listView}
                            </div>
                        </ReflexElement>
                
                        <ReflexSplitter propagate={true}/>
                
                        <ReflexElement className="right-bar"
                            minSize="200"
                            flex={0.5}>
                            <Note 
                                noteTypes={noteTypes}
                                note={this.state.activeNote} 
                                parents={this.state.parents} 
                                setDone={this.setDone} 
                                setType={this.setType} 
                                setTitle={this.setTitle}
                                setPriority={this.setPriority}
                                handleChangeTitle={this.handleChangeTitle}
                                handleChangePriority={this.handleChangePriority}
                                priority={this.state.priority}
                                addTag={this.addTag}
                            />
                        </ReflexElement>
                
                    </ReflexContainer>

                </ReflexElement>
            
            
            </ReflexContainer>
        )
    }
}

export {App};