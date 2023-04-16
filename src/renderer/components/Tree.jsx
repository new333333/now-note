import React from 'react';


import { Input, Space } from 'antd';
const { Search } = Input;
const dayjs = require('dayjs')

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import '../css/jquery.fancytree-now-note.css';

import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.glyph';
import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
// import '../js/jquery.fancytree.contextMenu';
import '../js/jquery.fancytree.contextMenu-nowNote';

//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import ReactDOMServer from 'react-dom/server'
//import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { blue } from '@ant-design/colors';


class Tree extends React.Component {

	constructor(props) {
        super(props);
        this.domRef = React.createRef();
		this.loadTree = this.loadTree.bind(this);
    }

	
    loadTree(key, data) {
        let self = this;
        // console.log("loadTree, key=, this.props.trash=", key, this.props.trash);
        
        if (key.type == 'source') {

            return this.props.dataSource.getChildren(null, this.props.trash).then(function(rootNodes) {
                return self.mapToTreeData(rootNodes);
            });
          

        } else if (data.node) {

            data.result = this.props.dataSource.getChildren(data.node.key, this.props.trash).then(function(children) {
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
    
            tree.forEach((node) => {
    
                node.data = node.data || {};
                node.data.description = node.description;
                node.data.modifiedBy = node.modifiedBy;
                node.data.modifiedOn = node.modifiedOn;
                node.data.createdBy = node.createdBy;
                node.data.createdOn = node.createdOn;
                node.data.done = node.done;
                node.data.priority = node.priority;
                node.data.type = node.type;
                node.data.tags = node.tags;
				node.data.linkToKey = node.linkToKey;
				node.data.linkedNote = node.linkedNote;
				if (node.data.linkedNote) {
					node.title = node.data.linkedNote.title;
				}
                
                delete node.parent;
                delete node.modifiedOn;
                delete node.modifiedBy;
                delete node.description;
                delete node.createdOn;
                delete node.createdBy;
                delete node.done;
                delete node.priority;
                delete node.type;
                delete node.tags;
				delete node.linkToKey;
				delete node.linkedNote;

                node.lazy = true;
                
				if (node.data.linkedNote || !node.hasChildren) {
                    node.children = [];
                }
                setCheckBoxFromTyp(node);
    
            });
    
            return tree;
        }
    
        function setCheckBoxFromTyp(node) {
            if (!node) {
                return node;
            }
    
            node.data = node.data || {};
            node.unselectable = node.trash;
			
			if (node.data.linkedNote) {
				node.checkbox = node.data.linkedNote.type !== undefined && node.data.linkedNote.type === "task";
				node.selected = node.data.linkedNote.done !== undefined && node.data.linkedNote.done;
			} else {
				node.checkbox = node.data.type !== undefined && node.data.type === "task";
				node.selected = node.data.done !== undefined && node.data.done;
			}

            return node;
        }
    
    }

    componentDidMount() {
        this.init();
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
        if (node) {
            node.data.priority = priority;
        }
    }

    setDone(key, done) {
        let node = this.fancytree.getNodeByKey(key);
        if (node) {
            node.data.done = done;
            node.setSelected(done);
        }
    }

    setType(key, type) {
        let node = this.fancytree.getNodeByKey(key);
        if (node) {
            node.data.type = type;
            node.checkbox = node.data.type !== undefined && node.data.type === "task";

            let parentNode = node;
            while (parentNode) {
                parentNode.renderTitle();
                parentNode = parentNode.parent;
            }
        }
    }

    setTags(key, tags) {
        let node = this.fancytree.getNodeByKey(key);
        node.data.tags = tags;
    }

    setTitle(key, title) {
        let node = this.fancytree.getNodeByKey(key);
        if (node) {
            node.title = title;

            let parentNode = node;
            while (parentNode) {
                parentNode.renderTitle();
                parentNode = parentNode.parent;
            }
        }
        return node;
    }

	async delete(key) {
        console.log("delete, key=", key);
        this.props.delete(key);
    }

	async restore(key) {
        console.log("restore, key=", key);
        this.props.restore(key);
    }

	async openNoteInList(key) {
		console.log("openNoteInList, key=", key);
        this.props.openNoteInList(key);
	}

    async addNote(key, editableTitle) {
        console.log("addNote key, editableTitle", key, editableTitle);

		if (key) {
			let detailsNoteParents = await this.props.dataSource.getParents(key);
			await this.openNotes(detailsNoteParents);
		}

		let self = this;
		return new Promise(function(resolve) {

			let newNoteData = {
				checkbox: false,
				title: "",
				type: "note",
				priority: 0,
				done: false,
				expanded: false
			};

			let node;
			if (!key) {
				node = self.fancytree.getActiveNode();
				if (!node) {
					node = self.fancytree.getRootNode();
				}
			} else {
				node = self.fancytree.getNodeByKey(key);
			}

			console.log("addNote node", node);
			

			let hitMode = "over";
			let relativeToKey = node.key;

			self.props.dataSource.addNote(node.key, {
				title: newNoteData.title,
				type: newNoteData.type,
				priority: newNoteData.priority,
				done: newNoteData.done,
				expanded: false,
			}, "firstChild", relativeToKey).then(function(newNoteData) {
				if (node.key.startsWith("root_")) {
					self.fancytree.reload().then(function() {
						self.props.openNoteInTreeAndDetails(newNoteData.key, editableTitle);
						resolve(newNoteData);
					});
				} else {
					node.resetLazy();
					self.props.openNoteInTreeAndDetails(newNoteData.key, editableTitle);
				}
			});
		});
    }
	
	
	async openNotes(parents, editableTitle) {
		let noteToOpen = parents.shift();

		let node = this.fancytree.getNodeByKey(noteToOpen.key);
		if (node) {
			await node.load();
		}
		if (parents.length > 0) {
			await this.openNotes(parents, editableTitle)
		} else if (node) {
			await node.makeVisible();
			if (parents.length == 0) {
				node.setActive();
				node.setFocus();
				if (editableTitle) {
					node.editStart();
				}
			}
		}

	}

	async remove(key) {
		let node = this.fancytree.getNodeByKey(key);
		node.remove();
	}

	async reload(key) {
		if (!key) {
			await this.fancytree.reload();
		} else {
			let self = this;

			return new Promise(function(resolve) {
	
				let node = self.fancytree.getNodeByKey(key);
				if (!node) {
					resolve();
				}
	
				let resetLazyResult = node.resetLazy();
				console.log("reload, resetLazyResult=", resetLazyResult);
				node.setExpanded(true).then(function() {
					resolve();
				});
			});
		}
	}

    init() {
        const $domNode = $(this.domRef.current);

        let self = this;

        $domNode.fancytree({
            extensions: ["dnd5", "contextMenu", /*"glyph",*/ "edit"],
			checkbox: true,
			escapeTitles: true,
            nodata: false,
            source: this.loadTree,
            lazyLoad: this.loadTree,


			edit: {
				adjustWidthOfs: 4,   // null: don't adjust input size to content
				inputCss: { minWidth: "3em" },
				triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
				beforeEdit: () => {
					// Return false to prevent edit mode
					//console.log("beforeEdit");
				},
				edit: () => {
					// Editor was opened (available as data.input)
					//console.log("edit");
				},
				beforeClose: () => {
					// Return false to prevent cancel/save (data.input is available)
					//console.log("beforeClose");
				},  
				save: (event, data) => {
					(function(event, data) {
						setTimeout(function() {
							if (event && event.type == 'save' && data.dirty) {
								console.log("save", data.node.title);

								self.props.handleChangeTitle(data.node.key, data.node.title).then(function() {
									console.log("saved");
								});
							}
						}, 500);
					})(event, data);
					return true;
				},         // Save data.input.val() or return false to keep editor open
				close: () => {
					// Editor was removed
					//console.log("close");
				},
			},


			/*glyph: {
				preset: "awesome",
				map: {}
			},*/
			icon: function(event, data) {
				if (data.node.statusNodeType == "loading") {
					return false;
				}
				if (data.node.data.linkedNote) {
					//return {html: ReactDOMServer.renderToString(<FontAwesomeIcon icon={solid("note-sticky")} />)}
					console.log("Tree icon data.linkedNote", data.node.data.linkedNote);
					console.log("Tree icon data.linkToKey", data.node.data.linkToKey);
					return {
						html: ReactDOMServer.renderToString(
								<i 
									data-nnlinktonote={data.node.data.linkToKey}
									className="fa-solid fa-square-up-right" 
									style={{
										color: blue[5],
										cursor: "pointer",
									}}></i>
							)
					};
				}
				// return {html: ReactDOMServer.renderToString(<FontAwesomeIcon icon={solid("check")} />)}
				return false;
				
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

			init: function(event, data) {
				// console.log(">>>>> FancyTRee initialized");
                self.props.treeIsInitialized();
			},

            activate: function(event, data) {
                // use click insteed self.props.openNoteDetails(data.node.key);
                
			},

            expand: function(event, data, a, b) {
                self.props.expandNote(data.node.key, true);
			},

			collapse: function(event, data) {
                self.props.expandNote(data.node.key, false);
			},

            click: function(event, data) {
				console.log("tree click node", data.node.key, data);
                var node = data.node,
                    // Only for click and dblclick events:
                    // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
                    targetType = data.targetType;
            
                // we could return false to prevent default handling, i.e. generating
                // activate, expand, or select events

                if (data.targetType == "title") {
                    self.props.openNoteDetails(data.node.key);
                } else if (data.originalEvent.target.dataset.nnlinktonote) {
					self.props.openNoteInTreeAndDetails(data.originalEvent.target.dataset.nnlinktonote, false);
				}
            },

            select: function(event, data) {
                self.props.handleChangeDone(data.node.key, data.node.selected, true);

				data.node.data.done = data.node.selected;
				
				let parentNode = data.node;
				while (parentNode) {
					parentNode.renderTitle();
					parentNode = parentNode.parent;
				}

			},

			contextMenu: {
				zIndex: 100,
				menu: function(node) {

					let menu = {};

					if (node.data.linkToKey) {
						menu["gotoLinkedFrom"] = { "name": "Go to linked Note" };
					}
					if (!self.props.trash) {
						menu["add"] = { "name": "Add" };
					}
					menu["open"] = { "name": "Show Note" };
					menu["openlist"] = { "name": "List sub notes" };
					menu["delete"] = { "name": self.props.trash ? "Delete Permanently" : "Move To Trash" };
					if (self.props.trash) {
						menu["restore"] = { "name": "Restore" };
					}
					return menu;
				},
				actions: function(node, action, options) {
					// console.log("FancyTree contextMenu node, action, options", node, action, options);

					if (action == "open") {
						self.props.openNoteDetails(node.key).then(function() {
							node.setActive();
							node.setFocus();
						});
					} else if (action == "add") {
						self.addNote(node.key, true);
					} else if (action == "delete") {
						self.delete(node.key);
					} else if (action == "restore") {
						self.restore(node.key);
					} else if (action == "openlist") {
						self.openNoteInList(node.key);
					} else if (action == "gotoLinkedFrom") {
						console.log("FancyTree contextMenu gotoLinkedFrom", node.data.linkToKey);
						self.props.openNoteInTreeAndDetails(node.data.linkToKey, false).then(function() {
						});
					}
				}
			  },

            dnd5: {
				// autoExpandMS: 400,
				// preventForeignNodes: true,
				// preventNonNodes: true,
				preventRecursion: true, // Prevent dropping nodes on own descendants
				// preventSameParent: true,
				preventVoidMoves: true, // Prevent moving nodes 'before self', etc.
				// effectAllowed: "all",
				// dropEffectDefault: "move", // "auto",
				multiSource: false,  // drag all selected nodes (plus current node)

				// --- Drag-support:

				dragStart: function(node, data) {
					/* This function MUST be defined to enable dragging for the tree.
					  *
					  * Return false to cancel dragging of node.
					  * data.dataTransfer.setData() and .setDragImage() is available
					  * here.
					  */
					console.log("T1: dragStart: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
						", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);

					// Set the allowed effects (i.e. override the 'effectAllowed' option)
					data.effectAllowed = "all";

					// Set a drop effect (i.e. override the 'dropEffectDefault' option)
					// data.dropEffect = "link";
					// data.dropEffect = "copy";

					// We could use a custom image here:
					// data.dataTransfer.setDragImage($("<div>TEST</div>").appendTo("body")[0], -10, -10);
					// data.useDefaultImage = false;

					// Return true to allow the drag operation
					return true;
				},
				dragDrag: function(node, data) {
					//   console.log("dragDrag", null, 2000,
					//     "T1: dragDrag: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					//     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed );
				},
				dragEnd: function(node, data) {
					//   console.log( "T1: dragEnd: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					//     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
					//     alert("T1: dragEnd")
				},

				// --- Drop-support:

				dragEnter: function(node, data) {
					// console.log("T1: dragEnter: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					//	", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);

					// data.dropEffect = "copy";
					return true;
				},
				dragOver: function(node, data) {
					// console.log("dragOver", null, 2000,
					// 	"T1: dragOver: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					// 	", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed);

					// Assume typical mapping for modifier keys
					data.dropEffect = data.dropEffectSuggested;
					// data.dropEffect = "move";
				},
				dragLeave(node, data) {
					// console.log("dragLeave", null, 2000,
					// 	"T1: dragOver: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					// 	", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed);

				},
				dragDrop: function(node, data) {
					console.log("dragDrop", data.dropEffectSuggested);

					let newNode,
						transfer = data.dataTransfer,
						sourceNodes = data.otherNodeList,
						mode = data.dropEffect;

					if (data.hitMode === "after" && sourceNodes) {
						// sourceNodes is undefined when dropping not node (file, text, etc.)
						// If node are inserted directly after target node one-by-one,
						// this would reverse them. So we compensate:
						sourceNodes.reverse();
					}
					if (data.otherNode) {
						// ignore mode, always move
						var oldParentNote = data.otherNode.parent;
						
						// hitMode === "after" || hitMode === "before" || hitMode === "over"
						console.log("data.hitMode", data.hitMode);


						var key = data.otherNode.key;
						var from = oldParentNote.key;
						var to = data.hitMode === "over" ? node.key : node.parent.key;

						console.log("key, from, to", key, from, to);

						// drop on itself
						if (key != to) {

							if (data.dropEffectSuggested == "link") {
								// create link when dragged with 'alt'

								self.props.dataSource.addNote(node.key, {
									// title: "Link to " + key,
									type: "link",
									linkToKey: key,
									//priority: newNoteData.priority,
									//done: newNoteData.done,
									//expanded: false,
								}, "firstChild", to).then(function(newNoteData) {
									if (node.key.startsWith("root_")) {
										self.fancytree.reload().then(function() {
											self.props.openNoteInTreeAndDetails(newNoteData.key, false);
											resolve(newNoteData);
										});
									} else {
										node.resetLazy();
										self.props.openNoteInTreeAndDetails(newNoteData.key, false);
									}
								});

							} else {
								self.props.dataSource.moveNote(key, from, to, data.hitMode, node.key).then(function() {
									console.log("moveNote done");
									data.otherNode.moveTo(node, data.hitMode);
								});
							}

						}
						
						data.tree.render(true, false);
					} else if (data.files.length) {
						
						console.log("transfer files", transfer.items);
						for (let i = 0; i < transfer.items.length; i++) {
							let item = transfer.items[i];

							let entry = item.getAsFile();
							console.log("entry as file", entry);

							self.props.dataSource.addFile(data.hitMode === "over" ? node.key : node.parent.key, entry.path, data.hitMode, node.key).then(function() {
								console.log("addFile done");

								if (data.hitMode == "over") {
									node.resetLazy();
									node.setExpanded(true);
								} else {
									if (node.parent.key.startsWith("root_")) {
										window.n3.loadNotes().then(function(tree) {
											$.ui.fancytree.getTree("[data-tree]").reload(tree);
										});
									} else {
										node.parent.resetLazy();
										node.parent.setExpanded(true);
									}
									
								}

							});
						}
						
					} else {
						console.log("@TODO: drop something (text or other metadata) it's not ready yet");
						// Drop a non-node
						let newNodeData = window.n3.node.getNewNodeData();
						console.log("transfer", transfer);
						let text = transfer.getData("text");
						newNodeData.data.description = text;

						console.log("transfer text", text);
						var firstLine = text.split('\n')[0] || "";
						newNodeData.title = firstLine.trim();
						

	
						self.props.dataSource.addNote(data.hitMode === "over" ? node.key : node.parent.key, {
							title: newNodeData.title,
							type: newNodeData.type,
							priority: newNodeData.priority,
							done: newNodeData.done,
							description: newNodeData.description
						}, data.hitMode, data.hitMode === "over" ? node.key : node.parent.key).then(function(newNodeData) {
							console.log("write back added", note);

							let newNode = node.addNode(newNodeData, data.hitMode);

						});

					}
					node.setExpanded();
				}
			}
        });
        $(".fancytree-container", $domNode).addClass("fancytree-connectors");
        this.fancytree = $.ui.fancytree.getTree($domNode);
    }

	shouldComponentUpdate(nextProps, nextState, nextContext) {
		// render tree only ones
        return !this.domRef.current;       
    }

    render() {
		// console.log("FancyTree render()");
        return (
			<div className='n3-tree' ref={this.domRef}>
			</div>
        );
    }
}

export {Tree};