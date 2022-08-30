import React from 'react';

import { AudioOutlined } from '@ant-design/icons';
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

class App extends React.Component {

    constructor() {
        super();
        this.loadTree = this.loadTree.bind(this);
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

    render() {
        return (
            <ReflexContainer orientation="vertical">
        
                <ReflexElement className="left-bar"
                    minSize="200"
                    flex={0.25}>
                    <FancyTree name="new333" loadTree={this.loadTree}/>
                </ReflexElement>
        
                <ReflexSplitter propagate={true}/>
        
                <ReflexElement className="middle-bar"
                    minSize="200"
                    flex={0.25}>
                    <NotesList />
                </ReflexElement>
        
                <ReflexSplitter propagate={true}/>
        
                <ReflexElement className="right-bar"
                    minSize="200"
                    flex={0.5}>
                    <div className="pane-content">
                        <label>
                        Right Pane (resizable)
                        </label>
                    </div>
                </ReflexElement>
        
            </ReflexContainer>
        )
    }
}

export {App};