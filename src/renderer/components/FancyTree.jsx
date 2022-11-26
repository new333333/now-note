import React from 'react';


import { Input, Space } from 'antd';
const { Search } = Input;
const dayjs = require('dayjs')

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import '../css/jquery.fancytree-now-note.css';

import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import '../js/jquery.fancytree.contextMenu';


class FancyTree extends React.Component {

	constructor(props) {
        super(props);
        this.domRef = React.createRef();

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
        // memory... node.data.description = note.description;
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

	async loadList(key) {
		console.log("loadList, key=", key);
        this.props.loadList(key);
	}

    async addNote(key) {
        console.log("addNote key", key);
		let self = this;
		return new Promise(function(resolve) {

			let newNoteData = {
				checkbox: false,
				title: dayjs().format("[am] DD.MM.YYYY [um] HH:mm[Uhr]"),
				type: "note",
				priority: 0,
				done: false,
				expanded: false
			};

			let node;
			if (!key) {
				node = self.fancytree.getRootNode();
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
				// createdBy: window.nn.userSettings.settings.userName
			}, "firstChild", relativeToKey).then(function(newNoteData) {
				if (node.key.startsWith("root_")) {
					self.fancytree.reload().then(function() {
						let newNode = self.fancytree.getNodeByKey(newNoteData.key);
						newNode.setActive();
						resolve(newNoteData);
					});
				} else {
					node.resetLazy();
					node.setExpanded(true).then(function() {
						let newNode = self.fancytree.getNodeByKey(newNoteData.key);
						newNode.setActive();
						resolve(newNoteData);
					});
				}
				// let treeData = window.n3.dataToTreeData([newNoteData]);
				// let newNode = node.addNode(treeData[0], "firstChild");
				// newNode.setActive();
			});
		});
    }

	async openNotes(detailsNoteParents) {
		let self = this;

		for (let i = 0; i < detailsNoteParents.length; i++) {
			let noteToOpen = detailsNoteParents[i];

			console.log("openNotes, noteToOpen.key=", noteToOpen.key);
			let node = self.fancytree.getNodeByKey(noteToOpen.key);
			console.log("openNotes, node=", node);

			await node.setExpanded();
			await node.makeVisible();
			console.log("openNotes", detailsNoteParents);
			
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
            extensions: ["dnd5", "contextMenu"],
			checkbox: true,
			icon: false,
			escapeTitles: true,
            nodata: false,
            source: this.props.loadTree,
            lazyLoad: this.props.loadTree,
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
                // use click insteed self.props.activateNote(data.node.key);
                
			},

            expand: function(event, data, a, b) {
                self.props.expandNote(data.node.key, true);
			},

			collapse: function(event, data) {
                self.props.expandNote(data.node.key, false);
			},

            click: function(event, data) {
                var node = data.node,
                    // Only for click and dblclick events:
                    // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
                    targetType = data.targetType;
            
                // we could return false to prevent default handling, i.e. generating
                // activate, expand, or select events

                if (data.targetType != "checkbox" && data.targetType != "expander") {
                    self.props.activateNote(data.node.key);
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

					menu["add"] = { "name": "Add" };
					menu["open"] = { "name": "Open Details" };
					menu["openlist"] = { "name": "Open List" };
					menu["delete"] = { "name": "Delete" };

					if (self.props.trash) {
						menu["restore"] = { "name": "Restore" };
					}
					return menu;
				},
				actions: function(node, action, options) {
					console.log("FancyTree contextMenu node, action, options", node, action, options);

					if (action == "open") {
						self.props.activateNote(node.key);
					} else if (action == "add") {
						self.addNote(node.key);
					} else if (action == "delete") {
						self.delete(node.key);
					} else if (action == "restore") {
						self.restore(node.key);
					} else if (action == "openlist") {
						self.loadList(node.key);
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
				dropEffectDefault: "move", // "auto",
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
					data.dropEffect = "copy";

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
						
						self.props.dataSource.moveNote(data.otherNode.key, oldParentNote.key, data.hitMode === "over" ? node.key : node.parent.key, data.hitMode, node.key).then(function() {
							console.log("moveNote done");
							data.otherNode.moveTo(node, data.hitMode);
						});
						
						data.tree.render(true, false);
					} else if (data.files.length) {
						
						console.log("transfer.items", transfer.items);
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
						console.log("@TODO: it's not ready yet");
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

    render() {

        return (
			<div className='n3-tree' ref={this.domRef}>
			</div>
        );
    }
}

export {FancyTree};