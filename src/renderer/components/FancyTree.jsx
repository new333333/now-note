import React from 'react';


import { Input, Space } from 'antd';
const { Search } = Input;

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import 'jquery.fancytree/dist/modules/jquery.fancytree.table';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.filter';


class FancyTree extends React.Component {

    constructor() {
        super();
        this.domRef = React.createRef();
        this.onSearch = this.onSearch.bind(this);

    }

    componentDidMount() {
        this.init();
    }

    setNote(note) {
        if (!note) {
            return;
        }
        let node = this.fancytree.getNodeByKey(note.key);
        node.data.priority = note.priority;
        node.data.done = note.done;
        node.data.description = note.description;
        node.setSelected(note.done);
        node.data.type = note.type;
        node.data.tags = note.tags;
        node.title = note.title;
    }

    setActive(key) {
        let node = this.fancytree.getNodeByKey(key);
        node.setActive();
        return node;
    }

    deactiveNote() {
        let node = this.fancytree.getActiveNode();
        node.setActive(false);
        return node;
    }

    setPriority(key, priority) {
        let node = this.fancytree.getNodeByKey(key);
        node.data.priority = priority;
    }

    setDone(key, done) {
        let node = this.fancytree.getNodeByKey(key);
        node.data.done = done;
        node.setSelected(done);
    }

    setType(key, type) {
        let node = this.fancytree.getNodeByKey(key);
        node.data.type = type;
        node.checkbox = node.data.type !== undefined && node.data.type === "task";

        let parentNode = node;
        while (parentNode) {
            parentNode.renderTitle();
            parentNode = parentNode.parent;
        }
    }

    setTags(key, tags) {
        let node = this.fancytree.getNodeByKey(key);
        node.data.tags = tags;
    }

    setTitle(key, title) {
        let node = this.fancytree.getNodeByKey(key);
        node.title = title;

        let parentNode = node;
        while (parentNode) {
            parentNode.renderTitle();
            parentNode = parentNode.parent;
        }

        return node;
    }

    onSearch(event) {
        console.log("search", event.target.value);
        console.log("this.fancytree", this.fancytree);

        let self = this;

        let searchText = event.target.value;
        this.props.dataSource.search(searchText, -1, false).then(function(searchResults) {

            let foundNoteKeys = [];

			if (searchResults.length > 0) {
				foundNoteKeys = searchResults.map(function(searchResult) {
					return searchResult.key;
				});
			}

            self.fancytree.filterNodes(function(node) {
                let show = true;

                console.log("filterNodes", node);

                if (searchText.trim().length > 0) {
					show = show && foundNoteKeys.includes(node.key);
				}

                return show;

            });

        });
    }

    addNote(key, newNoteData) {
        console.log("addNote key", key, newNoteData);

        let node;
        if (!key) {
			node = this.fancytree.getRootNode();
		} else {
            node = this.fancytree.getNodeByKey(key);
        }

        console.log("addNote node", node);
        

		let hitMode = "over";
		let relativeToKey = node.key;
        let self = this;

		this.props.dataSource.addNote(node.key, {
			title: newNoteData.title,
			type: newNoteData.type,
			priority: newNoteData.priority,
			done: newNoteData.done,
			expanded: false,
			// createdBy: window.nn.userSettings.settings.userName
		}, "firstChild", relativeToKey).then(function(newNoteData) {
			console.log("write back added", newNoteData);

            if (node.key.startsWith("root_")) {
                self.fancytree.reload();
            } else {
                node.resetLazy();
                node.setExpanded(true);
            }


			// let treeData = window.n3.dataToTreeData([newNoteData]);
			// let newNode = node.addNode(treeData[0], "firstChild");
			// newNode.setActive();
		});
    }

    init() {
        const $domNode = $(this.domRef.current);

        let self = this;

        $domNode.fancytree({
            extensions: ["dnd5", "filter"],
			checkbox: true,
			icon: false,
			escapeTitles: true,
            nodata: false,
            source: this.props.loadTree,
            lazyLoad: this.props.loadTree,
            filter: {
				autoApply: true,   // Re-apply last filter if lazy data is loaded
				autoExpand: false, // Expand all branches that contain matches while filtered
				counter: false,     // Show a badge with number of matching child nodes near parent icons
				fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
				hideExpandedCounter: true,  // Hide counter badge if parent is expanded
				hideExpanders: true,       // Hide expanders if all child nodes are hidden by filter
				highlight: false,   // Highlight matches by wrapping inside <mark> tags
				leavesOnly: false, // Match end nodes only
				nodata: true,      // Display a 'no data' status node if result is empty
				mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
			},

            // Load all lazy/unloaded child nodes
			// (which will trigger `loadChildren` recursively)
            loadChildren: function(event, data) {
				data.node.visit(function(subNode) {
					if (subNode.isUndefined() && subNode.isExpanded()) {
						subNode.load();
					}
				});
			},

            activate: function(event, data) {
                self.props.activateNote(data.node.key);
			},

            select: function(event, data) {
                self.props.selectNote(data.node.key, data.node.selected);

				data.node.data.done = data.node.selected;
				
				let parentNode = data.node;
				while (parentNode) {
					parentNode.renderTitle();
					parentNode = parentNode.parent;
				}

			},
        });
        $(".fancytree-container", $domNode).addClass("fancytree-connectors");
        this.fancytree = $.ui.fancytree.getTree($domNode);
    }

    render() {

        return (
            <div style={{height: "100%", display: "flex", flexDirection: "column"}}>

                <div>
                    <Search placeholder="filter nodes" allowClear onChange={this.onSearch} style={{ width: '100%' }} />
                </div>
                
                <div className='n3-bar-grow'>
                    <div className='n3-tree' ref={this.domRef}>
                    </div>
                </div>
            </div>
        );
    }
}

export {FancyTree};