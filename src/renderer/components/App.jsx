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
            activeNoteKey: undefined,
            title: "",
            description: "",
            done: false,
            type: "note",
            priority: 0,
            tags: [],
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

        this.fancyTreeDomRef = React.createRef();

        let self = this;
        window.electronAPI.getPriorityStat().then(function(priorityStat) {
            self.setState({
                priorityStat: priorityStat
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
        let loadedNote = await window.electronAPI.getNote(noteKey);
        console.log("activateNote loadedNote", loadedNote);
        this.fancyTreeDomRef.current.setNote(loadedNote);

        let note = this.fancyTreeDomRef.current.setActive(noteKey);
        let parents = await window.electronAPI.getParents(noteKey);
        this.setState({
            activeNoteKey: note.key,
            title: note.title,
            description: note.data.description,
            done: note.data.done,
            type: note.data.type,
            priority: note.data.priority,
            tags: note.data.tags,
            parents: parents,
        });
    }

    async setDescription(noteKey, description) {
        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            description: description	
        });
    }

    async setTitle(noteKey, title) {
        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            title: title	
        });
    }

    handleChangeTitle(noteKey, title) {
        this.fancyTreeDomRef.current.setTitle(noteKey, title);
        this.setState({
            title: title,
        });
    }

    async selectNote(noteKey, done) {
        this.setState({
            done: done,
        });
        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            done: done	
        });
    }
    
    async setDone(noteKey, done) {
        this.setState({
            done: done,
        });
        this.fancyTreeDomRef.current.setDone(noteKey, done);
        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            done: done	
        });
    }

    async setType(noteKey, type) {
        this.setState({
            type: type,
        });
        this.fancyTreeDomRef.current.setType(noteKey, type);
        let modifiedNote = await window.electronAPI.modifyNote({
            key: noteKey, 
            type: type	
        });
    }

    async setPriority(noteKey, priority) {
        this.setState({
            priority: priority,
        });
        this.fancyTreeDomRef.current.setPriority(noteKey, priority);
        await window.electronAPI.modifyNote({
            key: noteKey, 
            priority: priority	
        });

        let self = this;
        window.electronAPI.getPriorityStat().then(function(priorityStat) {
            self.setState({
                priorityStat: priorityStat
            });
        });
    }

    async addTag(noteKey, tag) {
        let tags = await window.electronAPI.addTag(noteKey, tag);
        this.fancyTreeDomRef.current.setTags(noteKey, tags);
        this.setState({
            tags: tags
        });
    }

    async deleteTag(noteKey, tag) {
        let tags = await window.electronAPI.removeTag(noteKey, tag);
        this.fancyTreeDomRef.current.setTags(noteKey, tags);
        this.setState({
            tags: tags
        });
    }


    render() {

        let listView = <FancyTree
                            ref={this.fancyTreeDomRef}
                            name="new333" 
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
                    <NoteBreadCrumb parents={this.state.parents} activateNote={this.activateNote} />
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
                                priorityStat={this.state.priorityStat}

                                noteKey={this.state.activeNoteKey} 
                                title={this.state.title} 
                                done={this.state.done} 
                                type={this.state.type}
                                priority={this.state.priority}
                                description={this.state.description || ""}

                                setDone={this.setDone} 
                                setType={this.setType} 
                                setTitle={this.setTitle}
                                handleChangeTitle={this.handleChangeTitle}
                                
                                setDescription={this.setDescription}
                                setPriority={this.setPriority}

                                tags={this.state.tags}
                                addTag={this.addTag}
                                deleteTag={this.deleteTag}
                            />
                        </ReflexElement>
                
                    </ReflexContainer>

                </ReflexElement>
            
            
            </ReflexContainer>
        )
    }
}

export {App};