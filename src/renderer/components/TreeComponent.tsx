import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useContext,
} from 'react';
import log from 'electron-log';
import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import '../css/jquery.fancytree-now-note.css';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.glyph';
import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery.fancytree/dist/modules/jquery.fancytree.clones';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import '../js/jquery.fancytree.contextMenu';
import $ from 'jquery';
import { Fancytree, FancytreeNode } from 'jquery.fancytree';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import ReactDOMServer from 'react-dom/server';
//import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { blue } from '@ant-design/colors';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { HitMode, NoteDTO } from 'types';
import UIApiDispatch from 'renderer/UIApiDispatch';
import { NoteModel } from 'main/modules/DataModels';

const treeLog = log.scope('Tree');

const TreeComponent = React.memo(
  forwardRef(function TreeComponent(props, ref) {
    const domRef = useRef(null);
    const fancyTreeRef = useRef<Fancytree>(null);

    const uiApi = useContext(UIApiDispatch);

    // is trash view? reload tree -> in useEffect(() => initTree, trash
    const trash = useNoteStore((state) => state.trash);

    const noteToNode = useCallback((note: NoteModel, treeNode?: FancytreeNode) => {
        // console.log('noteToNode note=, treeNode=', note, treeNode);
        let node = treeNode;
        if (node === undefined || node === null) {
          node = {};
        }

        ['title'].forEach((attr) => {
          if (attr in note) {
            node[attr] = note[attr];
          }
        });

        node.data = node.data || {};

        [
          'description',
          'modifiedBy',
          'modifiedOn',
          'createdBy',
          'createdOn',
          'done',
          'priority',
          'type',
          'trash',
        ].forEach((attr) => {
          if (attr in note) {
            node.data[attr] = note[attr];
          }
        });


        // if ('title' in note) {
        //   node.title = note.title;
        // }
        // node.data = note.data || {};
        // if ('description' in note) {
        //   node.data.description = note.description;
        // }
        // if ('modifiedBy' in note) {
        //   node.data.modifiedBy = note.modifiedBy;
        // }
        // node.data.modifiedOn = note.modifiedOn;
        // node.data.createdBy = note.createdBy;
        // node.data.createdOn = note.createdOn;
        // node.data.done = note.done;
        // node.data.priority = note.priority;
        // node.data.type = note.type;
        // node.data.trash = note.trash;

        // node.data.tags = note.tags;
        // node.lazy = true;
        // if (!note.hasChildren) {
        //  node.children = [];
        // }

        if (
          note.childrenCount === 0 ||
          note.childrenCount === null ||
          node.childrenCount === '0'
        ) {
          node.children = [];
        }

        node.unselectable = note.trash;

        node.checkbox = node.data.type !== undefined && node.data.type === 'task';
        node.selected = node.data.done !== undefined && node.data.done;
        return node;
      },
      []
    );

    const getActiveNodeKey = useCallback((): string | undefined => {
      if (fancyTreeRef === null || fancyTreeRef.current === null) {
        return undefined;
      }
      let node = fancyTreeRef.current.getActiveNode();
      console.log("getActiveNodeKey node=", node);
      if (node === null) {
        node = fancyTreeRef.current.getRootNode();
        console.log("getActiveNodeKey root node=", node);
      }
      if (node === null) {
        return undefined;
      }
      return node.key;
    }, []);

    const addNode = useCallback(
      async (newNote: NoteDTO): Promise<NoteDTO | undefined> => {
        treeLog.debug('addNode() on update newNote=', newNote);
        if (newNote === undefined || newNote === null) {
          return undefined;
        }
        if (fancyTreeRef === null || fancyTreeRef.current === null) {
          return undefined;
        }

        let parentNode = null;
        if (newNote.parent !== null && newNote.parent !== undefined) {
          parentNode = fancyTreeRef.current.getNodeByKey(newNote.parent);
        } else {
          parentNode = fancyTreeRef.current.getRootNode();
        }
        treeLog.debug('addNode() parentNode=' + parentNode);
        if (parentNode === null) {
          return undefined;
        }
        await parentNode.setExpanded(true);

        const newNode = await parentNode.addNode(
          noteToNode(newNote),
          'firstChild'
        );

        console.log('addNode newNote=', newNote);

        newNode.key = newNote.key;

        newNode.setActive();
        newNode.setFocus();

        console.log('addNode after setRefKey newNode=', newNode);

        return newNote;
      },
      [noteToNode]
    );

    const removeNode = useCallback(async (key: string): Promise<void> => {
      if (fancyTreeRef.current === null) {
        return;
      }
      const node = fancyTreeRef.current.getNodeByKey(key);
      if (node === null) {
        return;
      }
      await node.remove();
    }, []);

    const updateNode = useCallback(async (note: NoteDTO) => {
      treeLog.debug('updateNode() note=', note);

      if (
        note === undefined ||
        note === null ||
        fancyTreeRef.current === null
      ) {
        return;
      }
      const node = fancyTreeRef.current.getNodeByKey(note.key);
      if (node === undefined || node === null) {
        return;
      }
      node.selected = note.done;
      node.title = note.title;
      node.checkbox =
        note.type !== undefined && note.type !== null && note.type === 'task';
      node.renderTitle();
    }, []);

    const focusNode = useCallback(async (key: string) => {
      if (key === undefined || key === null) {
        return;
      }
      if (fancyTreeRef.current === null) {
        return;
      }
      let node = fancyTreeRef.current.getNodeByKey(key);
      if (node === undefined || node === null) {
        const note: NoteDTO = await nowNoteAPI.getNoteWithDescription(key, true);
        if (
          note !== undefined &&
          note.keyPath !== null &&
          note.keyPath !== undefined &&
          note.keyPath.length >= 4
        ) {
          const keys = note.keyPath
            .substring(2, note.keyPath.length - 2)
            .split('/');
          for (let i = 0; i < keys.length; i += 1) {
            node = fancyTreeRef.current.getNodeByKey(keys[i]);
            if (node !== undefined && node !== null) {
              // eslint-disable-next-line no-await-in-loop
              await node.load();
            }
          }
        }
      }
      if (node === undefined || node === null) {
        return;
      }
      node.setActive();
      node.setFocus();
    }, []);

    const reloadNode = useCallback(async (nodeParam: FancytreeNode) => {
      if (fancyTreeRef.current === null) {
        return false;
      }
      let node = nodeParam;
      if (node === undefined || node === null) {
        node = fancyTreeRef.current.getRootNode();
      }
      if (node.key.startsWith('root_')) {
        await node.resetLazy();
        await fancyTreeRef.current.reload();
      } else {
        await node.resetLazy();
        await node.setExpanded(true);
      }
      return true;
    }, []);

    const move = useCallback(
      async (key: string, to: string, hitMode: HitMode) => {
        if (fancyTreeRef.current === null) {
          return false;
        }
        const node = fancyTreeRef.current.getNodeByKey(key);
        let moveToNode = null;
        if (to !== null && to !== undefined) {
          moveToNode = fancyTreeRef.current.getNodeByKey(to);
        } else {
          moveToNode = fancyTreeRef.current.getRootNode();
        }
        console.log(`move, to=, node=, moveToNode=`, to, node, moveToNode);

        if (node !== null && moveToNode !== null) {
          await node.moveTo(moveToNode, hitMode);
          return true;
        }
        if (node !== null) {
          console.log(`move, node.parent=`, node.parent);
          await reloadNode(node.parent);
        }
        if (moveToNode !== null) {
          await reloadNode(moveToNode);
        }
      },
      [reloadNode]
    );

    useImperativeHandle(
      ref,
      () => {
        return {
          getActiveNodeKey: (): string | undefined => {
            return getActiveNodeKey();
          },
          addNode: async (newNote: NoteDTO): Promise<NoteDTO | undefined> => {
            return addNode(newNote);
          },
          removeNode: async (key: string): Promise<void> => {
            return removeNode(key);
          },
          updateNode: async (note: NoteDTO): Promise<void> => {
            return updateNode(note);
          },
          focusNode: async (key: string): Promise<void> => {
            return focusNode(key);
          },
          reloadNode: async (key: string): Promise<boolean> => {
            if (fancyTreeRef.current === null) {
              return false;
            }
            const node = fancyTreeRef.current.getNodeByKey(key);
            return reloadNode(node);
          },
          move: async (
            key: string,
            to: string,
            hitMode: HitMode
          ): Promise<void> => {
            return move(key, to, hitMode);
          },
        };
      },
      [
        addNode,
        focusNode,
        getActiveNodeKey,
        move,
        reloadNode,
        removeNode,
        updateNode,
      ]
    );

    const handleChangeDone = useCallback(
      async (key: string, done: boolean) => {
        treeLog.debug(`handleChangeDone key=${key}, done=${done}`);
        if (uiApi === null) {
          return;
        }
        treeLog.debug(`handleChangeDone key=${key}, done=${done}`);
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          done,
        });
        uiApi.updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    const handleChangeExpanded = useCallback(
      async (key: string, expanded: boolean) => {
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          expanded,
        });
        if (uiApi === null) {
          return;
        }
        uiApi.updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    // on change any node tile
    const handleChangeTitle = useCallback(
      async (key: string, title: string) => {
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          title,
        });
        if (uiApi === null) {
          return;
        }
        uiApi.updateDetailNote(modifiedNote);
      },
      [uiApi]
    );

    const mapToTreeData = useCallback((tree) => {

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
          node.data.trash = node.trash;

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

          node.lazy = true;

          if (
            node.childrenCount === 0 ||
            node.childrenCount === '0' ||
            node.childrenCount === null
          ) {
            node.children = [];
          }
          // console.log('>>>> node=', node);
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

        node.checkbox = node.data.type !== undefined && node.data.type === "task";
        node.selected = node.data.done !== undefined && node.data.done;

        return node;
      }

      tree = mapNotesToTreeNodes(tree);
      return tree;
    }, []);

    const loadTree = useCallback(
      async (event: string | undefined, data) => {
        log.debug(`Tree.loadTree() trash=${trash}`);
        if (!trash) {
          // console.trace();
        }
        if (event !== undefined && event.type === 'source') {
          const rootNodes = await nowNoteAPI.getChildren(null, trash);
          log.debug(
            `Tree.loadTree() trash=${trash} -> rootNodes.length=${rootNodes.length}`
          );
          return mapToTreeData(rootNodes);
        }
        if (data !== undefined && data.node) {
          data.result = async () => {
            const children = await nowNoteAPI.getChildren(data.node.key, trash);
            log.debug(
              `Tree.loadTree() key=${data.node.key} trash=${trash} -> children.length=${children.length}`
            );
            return mapToTreeData(children);
          };
        }
        return [];
      },
      [mapToTreeData, trash]
    );

    const initTree = useCallback(async () => {
      log.debug(`Tree.initTree() trash=${trash}`);
      if (domRef.current === undefined || domRef.current === null) {
        return;
      }
      const $domNode = $(domRef.current);

      if ($domNode.fancytree) {
        try {
          $domNode.fancytree('destroy');
        } catch (error) {
        }
      }

      $domNode.fancytree({
        source: loadTree,
        lazyLoad: loadTree,

        extensions: ['dnd5', 'contextMenu', 'edit'],
        checkbox: true,
        escapeTitles: true,
        nodata: false,

        edit: {
          adjustWidthOfs: 4, // null: don't adjust input size to content
          inputCss: { minWidth: '3em' },
          triggerStart: [
            'clickActive',
            'f2',
            'dblclick',
            'shift+click',
            'mac+enter',
          ],
          beforeEdit: () => {
            // Return false to prevent edit mode
            // console.log("beforeEdit");
          },
          edit: () => {
            // Editor was opened (available as data.input)
            // console.log("edit");
          },
          beforeClose: () => {
            // Return false to prevent cancel/save (data.input is available)
            // console.log('beforeClose event=, data=, data.input.val()=', event, data, data.input.val());
          },
          save: (event, data) => {
            // console.log('save event=, data=, data.input.val()=', event, data, data.input.val());
            if (event && event.type === 'save' && data.dirty) {
              handleChangeTitle(data.node.key, data.input.val());
            }
            return true;
          }, // Save data.input.val() or return false to keep editor open
          close: () => {
            // Editor was removed
            // console.log("close");
          },
        },

        // TODO: icons in tree
        icon: (event, data) => {
          if (data.node.statusNodeType === 'loading') {
            return false;
          }
          // return {html: ReactDOMServer.renderToString(<FontAwesomeIcon icon={solid("check")} />)}
          return false;
        },

        loadChildren: (event, data) => {
          // Load all lazy/unloaded child nodes
          // (which will trigger `loadChildren` recursively)
          data.node.visit((subNode) => {
            if (subNode.isUndefined() && subNode.isExpanded()) {
              subNode.load();
            }
          });
        },

        init: (event, data) => {
        },

        activate: (event, data) => {
        },

        expand: (event, data) => {
          handleChangeExpanded(data.node.key, true);
        },

        collapse: (event, data) => {
          handleChangeExpanded(data.node.key, false);
        },

        click: async (event, data) => {
          console.log("tree click event=, data=", event, data, data.targetType);
          // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
          // we could return false to prevent default handling, i.e. generating
          // activate, expand, or select events

          // if (data.targetType !== 'expander' && data.targetType !== 'checkbox') {
          // fix for click on context menu
          if (data.targetType === 'title') {
            treeLog.debug('Click title');
            const { openDetailNote } = uiApi;
            await openDetailNote(data.node.key);
          }

        },

        select: (event, data) => {
          handleChangeDone(data.node.key, data.node.selected);
        },

        contextMenu: {
          zIndex: 100,
          menu: (node: FancytreeNode) => {
            console.log('Tree contextMenu node=', node);
            const menu = {};
            if (!node.data.trash) {
              menu['add'] = { name: 'Add' };
              menu['createLink'] = { name: 'Create link to this in...' };
              menu['moveToMenus'] = {
                name: 'Move...',
                items: {
                  moveTo: {
                    name: "Find..."
                  },
                  sep1: "---------",
                  moveToTop: {
                    name: "to Top"
                  },
                  moveOneUp: {
                    name: "One Up"
                  },
                  moveOneDown: {
                    name: "One Down"
                  },
                  moveToBottom: {
                    name: "to Bottom"
                  },
                  sep2: "---------",
                  moveToParent: {
                    name: "to Parent"
                  },
                },
              };
            }
            menu['open'] = { name: 'Show Note' };
            menu['delete'] = {
              name: node.data.trash ? 'Delete Permanently' : 'Move To Trash',
            };
            if (node.data.trash) {
              menu['restore'] = { name: 'Restore' };
            }
            return menu;
          },
          actions: async (node: FancytreeNode, action: string, options) => {
            console.log(`actions action=`, action);
            const {
              openDetailNote,
              deleteNote,
              addNote,
              openMoveToDialog,
              restoreNote,
            } = uiApi;

            if (action === 'open') {
              await openDetailNote(node.key);
            } else if (action === 'add') {
              await addNote(node.key);
            } else if (action === 'delete') {
              await deleteNote(node.key);
            } else if (action === 'restore') {
              restoreNote(node.key);
            } else if (action === 'moveTo') {
              await openMoveToDialog(node.key);
            }
          },
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
          multiSource: false, // drag all selected nodes (plus current node)

          dragStart (node, data) {
            /* This function MUST be defined to enable dragging for the tree.
            *
            * Return false to cancel dragging of node.
            * data.dataTransfer.setData() and .setDragImage() is available
            * here.
            */
            /*
            console.log(
              'T1: dragStart: ' +
                'data: ' +
                data.dropEffect +
                '/' +
                data.effectAllowed +
              ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
            */
            // Set the allowed effects (i.e. override the 'effectAllowed' option)
            data.effectAllowed = 'all';

            // Set a drop effect (i.e. override the 'dropEffectDefault' option)
            // data.dropEffect = "link";
            // data.dropEffect = "copy";

            // We could use a custom image here:
            // data.dataTransfer.setDragImage($("<div>TEST</div>").appendTo("body")[0], -10, -10);
            // data.useDefaultImage = false;

            // Return true to allow the drag operation
            return true;
          },
          dragDrag (node, data) {
            //   console.log("dragDrag", null, 2000,
            //     "T1: dragDrag: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
            //     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed );
          },
          dragEnd (node, data) {
            //   console.log( "T1: dragEnd: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
            //     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
            //     alert("T1: dragEnd")
          },

          dragEnter (node, data) {
            // console.log("T1: dragEnter: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
            //	", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
            // data.dropEffect = "copy";
            return true;
          },

          dragOver(node, data) {
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

          dragDrop: async (node, data) => {
            console.log('dragDrop', data.dropEffectSuggested);
            let newNode;
            let transfer = data.dataTransfer;
            let sourceNodes = data.otherNodeList;
            let mode = data.dropEffect;

            if (data.hitMode === 'after' && sourceNodes) {
              // sourceNodes is undefined when dropping not node (file, text, etc.)
              // If node are inserted directly after target node one-by-one,
              // this would reverse them. So we compensate:
              sourceNodes.reverse();
            }

            if (data.otherNode) {
              // ignore mode, always move
              var oldParentNote = data.otherNode.parent;

              // hitMode === "after" || hitMode === "before" || hitMode === "over"
              console.log('data.hitMode', data.hitMode);

              var key = data.otherNode.key;
              var from = oldParentNote.key;
              var to = data.hitMode === 'over' ? node.key : node.parent.key;

              console.log('key, from, to', key, from, to);

              // drop on itself
              if (key !== to) {
                log.debug(
                  `Tree.dragDrop(), key=${key}, from=${from}, to=${to}, data.hitMode=${data.hitMode}, node.key=${node.key}`);
                await nowNoteAPI.moveNote(key, to, data.hitMode, node.key);
                data.otherNode.moveTo(node, data.hitMode);
              }

              // data.tree.render(true, false);
            } else if (data.files.length) {
              console.log('transfer files', transfer.items);
              for (let i = 0; i < transfer.items.length; i++) {
                let item = transfer.items[i];
                let entry = item.getAsFile();
                console.log('entry as file', entry);

                self.props.dataService
                  .addFileAsNote(
                    data.hitMode === 'over' ? node.key : node.parent.key,
                    entry.path,
                    data.hitMode,
                    node.key
                  )
                  .then(function () {
                    console.log('addFileAsNote done');
                    if (data.hitMode == 'over') {
                      node.resetLazy();
                      node.setExpanded(true);
                    } else {
                      if (node.parent.key.startsWith('root_')) {
                        window.n3.loadNotes().then(function (tree) {
                          $.ui.fancytree.getTree('[data-tree]').reload(tree);
                        });
                      } else {
                        node.parent.resetLazy();
                        node.parent.setExpanded(true);
                      }
                    }
                  });
              }
            } else {
              console.log(
                "@TODO: drop something (text or other metadata) it's not ready yet"
              );
              // Drop a non-node
              let newNodeData = window.n3.node.getNewNodeData();
              console.log('transfer', transfer);
              let text = transfer.getData('text');
              newNodeData.data.description = text;

              console.log('transfer text', text);
              var firstLine = text.split('\n')[0] || '';
              newNodeData.title = firstLine.trim();

              self.props.dataService
                .addNote(
                  data.hitMode === 'over' ? node.key : node.parent.key,
                  {
                    title: newNodeData.title,
                    type: newNodeData.type,
                    priority: newNodeData.priority,
                    done: newNodeData.done,
                    description: newNodeData.description,
                  },
                  data.hitMode,
                  data.hitMode === 'over' ? node.key : node.parent.key
                )
                .then(function (newNodeData) {
                  console.log('write back added', note);
                  let newNode = node.addNode(newNodeData, data.hitMode);
                });
            }
            node.setExpanded();
          },
        },
      });
      $('.fancytree-container', $domNode).addClass('fancytree-connectors');
      fancyTreeRef.current = $.ui.fancytree.getTree($domNode);
    }, [
      trash,
      loadTree,
      handleChangeTitle,
      handleChangeExpanded,
      uiApi,
      handleChangeDone,
      reloadNode,
    ]);

    useEffect(() => {
      log.debug(`Tree->useEffect on initTree trash=${trash}`);
      initTree();
    }, [initTree, trash]);

    // async delete(key) {
    //       console.log("delete, key=", key);
    //       this.props.delete(key);
    //   }

    // async restore(key) {
    //       console.log("restore, key=", key);
    //       this.props.restore(key);
    //   }

    // async openNoteInList(key) {
    // 	console.log("openNoteInList, key=", key);
    //       this.props.openNoteInList(key);
    // }

    // async openNotes(parents, editableTitle) {
    // 	let noteToOpen = parents.shift();

    // 	let node = fancyTreeRef.current.getNodeByKey(noteToOpen.key);
    // 	if (node) {
    // 		await node.load();
    // 	}
    // 	if (parents.length > 0) {
    // 		await this.openNotes(parents, editableTitle)
    // 	} else if (node) {
    // 		await node.makeVisible();
    // 		if (parents.length == 0) {
    // 			node.setActive();
    // 			node.setFocus();
    // 			if (editableTitle) {
    // 				node.editStart();
    // 			}
    // 		}
    // 	}

    // }

    // async remove(key) {
    // 	let node = fancyTreeRef.current.getNodeByKey(key);
    // 	node.remove();
    // }

    // async reload(key) {
    // 	if (!key) {
    // 		await fancyTreeRef.current.reload();
    // 	} else {
    // 		let self = this;

    // 		return new Promise(function(resolve) {

    // 			let node = fancyTreeRef.current.getNodeByKey(key);
    // 			if (!node) {
    // 				resolve();
    // 			}

    // 			let resetLazyResult = node.resetLazy();
    // 			console.log("reload, resetLazyResult=", resetLazyResult);
    // 			node.setExpanded(true).then(function() {
    // 				resolve();
    // 			});
    // 		});
    // 	}
    // }

    treeLog.debug(`render`);

    return <div className="n3-tree" ref={domRef} />;
  })
);

export default TreeComponent;
