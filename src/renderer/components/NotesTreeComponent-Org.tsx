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
import {
  Fancytree,
  FancytreeNode,
  NodeData,
  FancytreeOptions,
  EventData,
  JQueryEventObject,
} from 'jquery.fancytree';
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

function Sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const treeLog = log.scope('Tree');

const NotesTreeComponent = React.memo(
  forwardRef(function NotesTreeComponent(props, ref) {
    const domRef = useRef(null);
    const fancyTreeRef = useRef<Fancytree>(null);

    const uiApi = useContext(UIApiDispatch);

    // is trash view? reload tree -> in useEffect(() => initTree, trash
    const trash = useNoteStore((state) => state.trash);

    const noteToNode = useCallback((note: NoteDTO) => {
      const node: NodeData = {
        title:
          note.title !== undefined && note.title !== null ? note.title : '',
        lazy: true,
      };

      if (note.key !== undefined && note.key !== null) {
        node.key = note.key;
      }

      if (note.expanded !== undefined && note.expanded !== null) {
        node.expanded = note.expanded;
      }

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
      console.log(
        `noteToNode note.childrenCount=`,
        note.childrenCount,
        typeof note.childrenCount
      );
      if (note.childrenCount === 0) {
        node.children = [];
        console.log(`noteToNode set children[]`);
      }

      node.unselectable = note.trash === true;
      node.checkbox = note.type === 'task';
      node.selected = note.done !== undefined && note.done === true;

      console.log(`noteToNode node=`, node);

      return node;
    }, []);

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

        const newNode = parentNode.addNode(noteToNode(newNote), 'firstChild');

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
      node.data.type = note.type;
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
              while (node.isLoading()) {
                // eslint-disable-next-line no-await-in-loop
                await Sleep(500);
              }
              if (!node.isLoaded()) {
                // eslint-disable-next-line no-await-in-loop
                await node.load();
              }
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
      async (
        key: string,
        to: string | undefined | null,
        hitMode: HitMode,
      ): Promise<boolean> => {
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
          node.moveTo(moveToNode, hitMode);
          return true;
        }
        if (node !== null) {
          console.log(`move, node.parent=`, node.parent);
          await reloadNode(node.parent);
        }
        if (moveToNode !== null) {
          await reloadNode(moveToNode);
        }
        return true;
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
          move: (
            key: string,
            to: string | undefined | null,
            hitMode: HitMode
          ): Promise<boolean> => {
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

    const handleChangeType = useCallback(
      async (key: string, type: string) => {
        treeLog.debug(`handleChangeType key=${key}, type=${type}`);
        if (uiApi === null) {
          return;
        }
        treeLog.debug(`handleChangeType key=${key}, type=${type}`);
        const modifiedNote = await nowNoteAPI.modifyNote({
          key,
          type,
        });
        uiApi.updateDetailNote(modifiedNote);
        uiApi.updateNodeInTree(modifiedNote);
      },
      [uiApi]
    );

    const handleSearch = useCallback(
      async (key: string) => {
        if (uiApi === null) {
          return;
        }
        uiApi.search(key);
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

    const loadTreeRoot = useCallback(async (): Promise<NodeData[]> => {
      log.debug(`Tree.loadTree() trash=${trash}`);
      const rootNodes = await nowNoteAPI.getChildren(null, trash);
      if (rootNodes === undefined) {
        return [];
      }
      return rootNodes.map((note) => noteToNode(note));
    }, [noteToNode, trash]);

    const lazyLoad = useCallback(
      async (event: JQueryEventObject, data: EventData): Promise<void> => {
        data.result = async () => {
          log.debug(`Tree.loadTree() key=${data.node.key} trash=${trash}`);
          const children = await nowNoteAPI.getChildren(data.node.key);
          if (children === undefined) {
            return [];
          }
          return children.map((note) => noteToNode(note));
        };
      },
      [noteToNode, trash]
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

      const options: FancytreeOptions = {
        source: loadTreeRoot,
        lazyLoad,

        extensions: ['dnd5', 'contextMenu', 'edit'],
        checkbox: true,
        escapeTitles: true,
        nodata: false,

        edit: {
          adjustWidthOfs: 4, // null: don't adjust input size to content
          inputCss: { minWidth: '3em' },
          triggerStart: [
            // 'clickActive',
            'f2',
            'dblclick',
            'shift+click',
            'mac+enter',
          ],
          beforeEdit: (event: JQueryEventObject, data: EventData) => {
            // Return false to prevent edit mode
            // console.log("beforeEdit");
          },
          edit: (event: JQueryEventObject, data: EventData) => {
            // Editor was opened (available as data.input)
            // console.log("edit - event, data", event, data.input);
            // select input text on edit
            $(data.input).select();
          },
          beforeClose: (event: JQueryEventObject, data: EventData) => {
            // Return false to prevent cancel/save (data.input is available)
            // console.log('beforeClose event=, data=, data.input.val()=', event, data, data.input.val());
          },
          save: (event: JQueryEventObject, data: EventData) => {
            // console.log('save event=, data=, data.input.val()=', event, data, data.input.val());
            if (event && event.type === 'save' && data.dirty) {
              handleChangeTitle(data.node.key, data.input.val());
            }
            return true;
          }, // Save data.input.val() or return false to keep editor open
          close: (event: JQueryEventObject, data: EventData) => {
            // Editor was removed
            // console.log("close");
          },
        },

        // TODO: icons in tree
        icon: (event: JQueryEventObject, data: EventData) => {
          if (data.node.statusNodeType === 'loading') {
            return false;
          }
          // return {html: ReactDOMServer.renderToString(<FontAwesomeIcon icon={solid("check")} />)}
          return false;
        },

        loadChildren: (event: JQueryEventObject, data: EventData) => {
          // Load all lazy/unloaded child nodes
          // (which will trigger `loadChildren` recursively)
          data.node.visit((subNode) => {
            if (subNode.isUndefined() && subNode.isExpanded()) {
              subNode.load();
            }
          });
        },

        init: (event: JQueryEventObject, data: EventData) => {
        },

        activate: (event: JQueryEventObject, data: EventData) => {
        },

        expand: (event: JQueryEventObject, data: EventData) => {
          handleChangeExpanded(data.node.key, true);
        },

        collapse: (event: JQueryEventObject, data: EventData) => {
          handleChangeExpanded(data.node.key, false);
        },

        click: (event: JQueryEventObject, data: EventData): boolean => {
          console.log("tree click event=, data=", event, data, data.targetType);
          // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
          // we could return false to prevent default handling, i.e. generating
          // activate, expand, or select events

          // if (data.targetType !== 'expander' && data.targetType !== 'checkbox') {
          // fix for click on context menu
          if (data.targetType === 'title') {
            treeLog.debug('Click title');
            const { openDetailNote } = uiApi;
            openDetailNote(data.node.key);
          }
          return true;
        },

        select: (event: JQueryEventObject, data: EventData) => {
          handleChangeDone(data.node.key, data.node.isSelected());
        },

        contextMenu: {
          zIndex: 100,
          menu: (node: FancytreeNode) => {
            console.log('Tree contextMenu node=', node);
            const menu: any = {};
            if (!node.data.trash) {
              menu.add = { name: 'Add note' };
              menu.editTitle = { name: 'Rename' };
              menu.changeType = {
                name: `Change to ${node.data.type === 'note' ? 'Task' : 'Note'}`,
              };
              menu.createLink = { name: 'Create link to this in...' };
              menu.moveToMenus = {
                name: 'Move...',
                items: {
                  moveTo: {
                    name: 'Find...',
                  },
                  sep1: '---------',
                  moveToTop: {
                    name: 'to Top',
                  },
                  moveOneUp: {
                    name: 'One Up',
                  },
                  moveOneDown: {
                    name: 'One Down',
                  },
                  moveToBottom: {
                    name: 'to Bottom',
                  },
                  sep2: '---------',
                  moveToParent: {
                    name: 'to Parent',
                  },
                  sep3: '---------',
                  moveToRoot: {
                    name: 'to Root',
                  },
                },
              };
              menu.search = { name: 'Search in...' };
            }
            menu.open = { name: 'Open' };
            menu.delete = {
              name: node.data.trash ? 'Delete Permanently' : 'Move To Trash',
            };
            if (node.data.trash) {
              menu.restore = { name: 'Restore' };
            }
            return menu;
          },
          actions: async (
            node: FancytreeNode,
            action: string,
            options: any
          ) => {
            console.log(`actions action=`, action);
            const {
              openDetailNote,
              deleteNote,
              addNote,
              openMoveToDialog,
              openCreateLinkDialog,
              restoreNote,
              moveNote,
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
            } else if (action === 'moveToRoot') {
              await moveNote(node.key, undefined);
            } else if (action === 'moveToParent') {
              if (node.parent === null || node.parent.parent === null) {
                return;
              }
              let parentNodeKey: string | undefined = node.parent.parent.key;
              console.log(`NotesTreeComponent parentNodeKey=`, parentNodeKey);
              if (parentNodeKey.startsWith('root_')) {
                parentNodeKey = undefined;
              }
              console.log(`NotesTreeComponent node.key=, parentNodeKey=`, node.key, parentNodeKey);
              await moveNote(node.key, parentNodeKey);
            } else if (action === 'moveToTop') {
              let to: string | undefined = node.parent.key;
              if (to.startsWith('root_')) {
                to = undefined;
              }
              await moveNote(node.key, to, 'firstChild');
            } else if (action === 'moveToBottom') {
              let to: string | undefined = node.parent.key;
              if (to.startsWith('root_')) {
                to = undefined;
              }
              await moveNote(node.key, to, 'over');
            } else if (action === 'moveOneUp') {
              await moveNote(node.key, undefined, 'up');
            } else if (action === 'moveOneDown') {
              await moveNote(node.key, undefined, 'down');
            } else if (action === 'createLink') {
              await openCreateLinkDialog(node.key);
            } else if (action === 'editTitle') {
              node.editStart();
            } else if (action === 'changeType') {
              await handleChangeType(node.key, node.data.type === 'note' ? 'task' : 'note');
            } else if (action === 'search') {
              await handleSearch(node.key);
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
              const oldParentNote: FancytreeNode = data.otherNode.parent;

              // hitMode === "after" || hitMode === "before" || hitMode === "over"
              console.log('data.hitMode', data.hitMode);

              const { key } = data.otherNode;
              const from = oldParentNote.key;
              // let to = data.hitMode === 'over' ? node.key : node.parent.key;
              let to = node.key;

              console.log('key, from, to', key, from, to);

              // drop on itself
              if (key !== to) {
                log.debug(
                  `Tree.dragDrop(), key=${key}, from=${from}, to=${to}, data.hitMode=${data.hitMode}, node.key=${node.key}`);
                if (to.startsWith('root_')) {
                  to = undefined;
                }
                await nowNoteAPI.moveNote(key, to, data.hitMode);
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
      };

      $domNode.fancytree(options);
      $('.fancytree-container', $domNode).addClass('fancytree-connectors');
      fancyTreeRef.current = $.ui.fancytree.getTree($domNode);
    }, [
      trash,
      loadTreeRoot,
      lazyLoad,
      handleChangeTitle,
      handleChangeExpanded,
      uiApi,
      handleChangeDone,
      handleChangeType,
      handleSearch,
    ]);

    useEffect(() => {
      log.debug(`Tree->useEffect on initTree trash=${trash}`);
      initTree();
    }, [initTree, trash]);

    return <div className="n3-tree" ref={domRef} />;
  })
);

export default NotesTreeComponent;
