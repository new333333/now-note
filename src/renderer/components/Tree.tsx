import {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import log from 'electron-log';
import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import '../css/jquery.fancytree-now-note.css';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.glyph';
import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import '../js/jquery.fancytree.contextMenu-nowNote';
import $ from 'jquery';
import Fancytree, { FancytreeClickFolderMode } from 'jquery.fancytree';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import ReactDOMServer from 'react-dom/server';
//import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { blue } from '@ant-design/colors';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { NoteDTO, UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';


export default function Tree() {
  const domRef = useRef(null);
  const fancyTreeRef = useRef(null);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const [
    detailsNote,
    updatedNote,
    updateDetailsNoteKey,
    updateDetailsNote,
    setDone,
    setTitle,
    setExpanded,
    setDetailsNoteTitleFocus,
    updateUpdatedNote,
    setReloadTreeNoteKey,
    reloadTreeNoteKey,
    addTreeNoteOnNoteKey,
    setAddTreeNoteOnNoteKey,
    trash,
  ] = useNoteStore((state) => [
    state.detailsNote,
    state.updatedNote,
    state.updateDetailsNoteKey,
    state.updateDetailsNote,
    state.setDone,
    state.setTitle,
    state.setExpanded,
    state.setDetailsNoteTitleFocus,
    state.updateUpdatedNote,
    state.setReloadTreeNoteKey,
    state.reloadTreeNoteKey,
    state.addTreeNoteOnNoteKey,
    state.setAddTreeNoteOnNoteKey,
    state.trash,
  ]);

  const noteToNode = useCallback((note: NoteDataModel, treeNode) => {
    // console.log('noteToNode note=, treeNode=', note, treeNode);

    let node = treeNode;
    if (node === undefined || node === null) {
      node = {};
    }

    [
      'title',
      'description',
      'modifiedBy',
      'modifiedOn',
      'createdBy',
      'createdOn',
      'done',
      'priority',
      'type',
      'trash',
      'linkToKey',
    ].forEach((attr) => {
      if (attr in note) {
        node[attr] = note[attr];
      }
    });

    /*
    if ('title' in note) {
      node.title = note.title;
    }
    node.data = note.data || {};
    if ('description' in note) {
      node.data.description = note.description;
    }
    if ('modifiedBy' in note) {
      node.data.modifiedBy = note.modifiedBy;
    }
    node.data.modifiedOn = note.modifiedOn;
    node.data.createdBy = note.createdBy;
    node.data.createdOn = note.createdOn;
    node.data.done = note.done;
    node.data.priority = note.priority;
    node.data.type = note.type;
    node.data.trash = note.trash;
    // node.data.tags = note.tags;
    node.data.linkToKey = note.linkToKey;
    // node.data.linkedNote = note.linkedNote;
    // node.lazy = true;
    // if (node.data.linkedNote) {
    //   node.title = node.data.linkedNote.title;
    // }
    // if (node.data.linkedNote || !note.hasChildren) {
    //  node.children = [];
    // }
    */

    node.unselectable = note.trash;

    if (node.data.linkToKey) {
      // node.checkbox = node.data.linkedNote.type !== undefined && node.data.linkedNote.type === "task";
      // node.selected = node.data.linkedNote.done !== undefined && node.data.linkedNote.done;
    } else {
      node.checkbox = node.data.type !== undefined && node.data.type === 'task';
      node.selected = node.data.done !== undefined && node.data.done;
    }
    return node;
  }, []);

  const updateTreeNode = useCallback(
    (note) => {
      // console.log('updateTreeNode note=', note);
      if (fancyTreeRef.current !== null && note !== null) {
        let node = fancyTreeRef.current.getNodeByKey(note.key);
        // console.log('updateTreeNode node=', node);
        if (node !== undefined) {
          noteToNode(note, node);
          let parentNode = node;
          while (parentNode) {
            // console.log('renderTitle', parentNode.key);
            parentNode.renderTitle();
            parentNode = parentNode.parent;
          }
        }
      }
    },
    [noteToNode]
  );


  useEffect(() => {
    (async () => {
      log.debug('Tree.useEffect() on update addTreeNoteOnNoteKey=', addTreeNoteOnNoteKey);
      if (addTreeNoteOnNoteKey === undefined) {
        return;
      }
      if (fancyTreeRef === null || fancyTreeRef.current === null) {
        return;
      }

      let node;
      if (addTreeNoteOnNoteKey === 'ACTIVE_TREE_NODE') {
        node = fancyTreeRef.current.getActiveNode();
        if (!node) {
          node = fancyTreeRef.current.getRootNode();
        }
      } else {
        node = fancyTreeRef.current.getNodeByKey(addTreeNoteOnNoteKey);
      }
      if (node === undefined || node === null) {
        return;
      }
      log.debug('addNote parent node=', node);
      await node.setExpanded(true);

      const newNote: NoteDataModel | undefined = await uiController.addNote(
        node.key,
        { title: '', type: 'note' },
        'over'
      );
      log.debug('addNote newNote=', newNote);
      updateUpdatedNote(newNote);
      setAddTreeNoteOnNoteKey(undefined);
    })();
  }, [
    addTreeNoteOnNoteKey,
    setAddTreeNoteOnNoteKey,
    uiController,
    updateUpdatedNote,
  ]);

  useEffect(() => {
    // console.log('Tree on update detailsNote.key=', detailsNote !== undefined ? detailsNote.key : '~null~');
    if (detailsNote !== undefined && fancyTreeRef.current !== undefined) {
      const node = fancyTreeRef.current.getNodeByKey(detailsNote.key);
      if (node !== undefined && node !== null) {
        // console.log('Tree on update node=', node);
        // TODO: funktioniert nicht so wirklich
        node.setActive();
	      node.setFocus();

        updateTreeNode(detailsNote);
      }
    }
  }, [detailsNote, updateTreeNode]);

  useEffect(() => {
    if (fancyTreeRef.current === null) {
      return;
    }
    if (reloadTreeNoteKey === undefined) {
      return;
    }

    async function runAsync() {
      if (reloadTreeNoteKey === null) {
        await fancyTreeRef.current.reload();
      } else {
        const node = fancyTreeRef.current.getNodeByKey(reloadTreeNoteKey);
        console.log('Tree reloadTreeNoteKey node=', node);
        if (node !== undefined && node !== null) {
          if (node.key.startsWith('root_')) {
            await fancyTreeRef.current.reload();
          } else {
            console.log('Tree reloadTreeNoteKey resetLazy');
            await node.resetLazy();
            await node.setExpanded(true);
          }
        }
      }
    }
    runAsync();
  }, [reloadTreeNoteKey]);

  useEffect(() => {
    async function refreshNode() {
      // console.log('Tree on update updatedNote=', updatedNote);
      if (
        fancyTreeRef.current === undefined ||
        fancyTreeRef.current === null ||
        updatedNote === undefined
      ) {
        return;
      }
      let node = fancyTreeRef.current.getNodeByKey(updatedNote.key);
      console.log('Tree on update node=', node);
      if (node !== undefined && node !== null) {
        // TODO: funktioniert nicht so wirklich
        node.setActive();
        node.setFocus();

        updateTreeNode(updatedNote);
      } else {
        // parent is root?
        if (updatedNote.parent === null) {
          await fancyTreeRef.current.reload();
        } else {
          // there is no in tree, is there a parent in tree? then add it as child
          const parentNode = fancyTreeRef.current.getNodeByKey(updatedNote.parent);
          console.log('Tree on update parentNode=', parentNode);
          if (parentNode !== null && parentNode !== undefined) {
            if (parentNode.key.startsWith("root_")) {
              await fancyTreeRef.current.reload();
                // openNoteInTreeAndDetails(newNoteData.key, editableTitle);
            } else {
              console.log('Tree on update node Load children');
              await parentNode.resetLazy();
            }
            await parentNode.setExpanded(true);
          }
        }

        console.log('Tree on update node Load children DONE');

        node = fancyTreeRef.current.getNodeByKey(updatedNote.key);
        console.log('Tree on update node=', node);
        if (node !== undefined && node !== null) {
          node.setActive();
          node.setFocus();
          updateDetailsNoteKey(updatedNote.key);
          setDetailsNoteTitleFocus(true);
          // node.editStart();
        }

        // self.props.openNoteInTreeAndDetails(newNoteData.key, editableTitle);

      }
    };
    refreshNode();
  }, [updatedNote, updateTreeNode, updateDetailsNoteKey, setDetailsNoteTitleFocus]);

  const handleChangeDone = useCallback(
    (key: string, done: boolean) => {
      // console.log('handleChangeDone key=, done=', key, done);
      setDone(key, done);
      uiController.modifyNote({
        key,
        done,
      });
    },
    [setDone, uiController]
  );

  const handleChangeTitle = useCallback(
    (key: string, title: string) => {
      // console.log('setTitle key=, title=', key, title);
      setTitle(key, title);
      uiController.modifyNote({
        key,
        title,
      });
    },
    [setTitle, uiController]
  );

  const handleChangeExpanded = useCallback(
    (key: string, expanded: boolean) => {
      // console.log('handleChangeExpanded key=, title=', key, expanded);
      setExpanded(key, expanded);
      uiController.modifyNote({
        key,
        expanded,
      });
    },
    [setExpanded, uiController]
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
        node.data.linkToKey = node.linkToKey;
        node.data.linkedNote = node.linkedNote;
        node.data.trash = node.trash;
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

        if (
          node.data.linkedNote ||
          node.childrenCount === 0 ||
          node.childrenCount === null
        ) {
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

    tree = mapNotesToTreeNodes(tree);
    return tree;
  }, []);

  log.debug(`Tree trash=${trash}`);

  const loadTree = useCallback(
    async (event: string | undefined, data) => {
      log.debug(`Tree.loadTree() trash=${trash}`);
      if (!trash) {
        // console.trace();
      }
      if (event !== undefined && event.type === 'source') {
        const rootNodes = await uiController.getChildren(null, trash);
        log.debug(
          `Tree.loadTree() trash=${trash} -> rootNodes.length=${rootNodes.length}`
        );
        return mapToTreeData(rootNodes);
      }
      if (data !== undefined && data.node) {
        data.result = async () => {
          const children = await uiController.getChildren(data.node.key, trash);
          log.debug(
            `Tree.loadTree() key=${data.node.key} trash=${trash} -> children.length=${children.length}`
          );
          return mapToTreeData(children);
        };
      }
      return [];
    },
    [mapToTreeData, trash, uiController]
  );

  const initTree = useCallback(async () => {
    log.debug(`Tree.initTree() trash=${trash}`);
    if (domRef.current === undefined || domRef.current === null) {
      return;
    }
    const $domNode = $(domRef.current);

    if ($domNode.fancytree) {
      try {
        $domNode.fancytree("destroy");
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
        if (data.node.data.linkedNote) {
          // return {html: ReactDOMServer.renderToString(<FontAwesomeIcon icon={solid("note-sticky")} />)}
          console.log('Tree icon data.linkedNote', data.node.data.linkedNote);
          console.log('Tree icon data.linkToKey', data.node.data.linkToKey);
          return {
            html: ReactDOMServer.renderToString(
              <i
                data-nnlinktonote={data.node.data.linkToKey}
                className="fa-solid fa-square-up-right"
                style={{
                  color: blue[5],
                  cursor: 'pointer',
                }}
              />
            )};
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

      click: (event, data) => {
        console.log("tree click event=, data=", event, data, data.targetType);
        // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
        // we could return false to prevent default handling, i.e. generating
        // activate, expand, or select events

        // if (data.targetType !== 'expander' && data.targetType !== 'checkbox') {
        // fix for click on context menu
        if (data.targetType === 'title') {
          updateDetailsNoteKey(data.node.key);
        }

        /*
        TODO: link
        if (data.targetType == "title") {
          self.props.openNoteDetails(data.node.key);
        } else if (data.originalEvent.target.dataset.nnlinktonote) {
          self.props.openNoteInTreeAndDetails(data.originalEvent.target.dataset.nnlinktonote, false);
        } */
      },

      select: (event, data) => {
        handleChangeDone(data.node.key, data.node.selected);
      },

      contextMenu: {
        zIndex: 100,
        menu: (node) => {
          console.log('Tree contextMenu node=', node);
          const menu = {};

          // TODO: link note
          if (node.data.linkToKey) {
            menu['gotoLinkedFrom'] = { name: 'Go to linked Note' };
          }
          if (!node.data.trash) {
            menu['add'] = { name: 'Add' };
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
        actions: async (node, action, options) => {
          console.log("FancyTree contextMenu node, action, options", node, action, options);
          if (action === 'open') {
            updateDetailsNoteKey(node.key);
          } else if (action === 'add') {
            // const newNote: NoteDTO | undefined = await uiController.addNote(node.key, { title: '', type: 'note' }, 'over');
            // console.log("handleNoteMenu, added note newNote=", newNote);
            // updateUpdatedNote(newNote);
            setAddTreeNoteOnNoteKey(node.key);
          } else if (action === 'delete') {
            // console.log("handleNoteMenu, delete note=", node);
            if (node.data.trash) {
              await uiController.deletePermanently(node.key);
            } else {
              await uiController.moveNoteToTrash(node.key);
            }
            setReloadTreeNoteKey(node.parent.key);
          } else if (action === 'restore') {
            await uiController.restore(node.key);
            setReloadTreeNoteKey(node.parent.key);
          } else if (action === 'gotoLinkedFrom') {
            // TODO: implement linked note
            console.log(
              'FancyTree contextMenu gotoLinkedFrom',
              node.data.linkToKey
            );
            self.props
              .openNoteInTreeAndDetails(node.data.linkToKey, false)
              .then(function () {});
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
              if (data.dropEffectSuggested == 'link') {
                // create link when dragged with 'alt'
                self.props.dataService
                  .addNote(
                    node.key,
                    {
                      // title: "Link to " + key,
                      type: 'link',
                      linkToKey: key,
                      // priority: newNoteData.priority,
                      // done: newNoteData.done,
                      //expanded: false,
                    },
                    'firstChild',
                    to
                  )
                  .then(function (newNoteData) {
                    if (node.key.startsWith('root_')) {
                      self.fancytree.reload().then(function () {
                        self.props.openNoteInTreeAndDetails(
                          newNoteData.key,
                          false
                        );
											resolve(newNoteData);
										});
                    } else {
                      node.resetLazy();
                      self.props.openNoteInTreeAndDetails(
                        newNoteData.key,
                        false
                      );
                    }
                  });
              } else {
                log.debug(
                  `Tree.dragDrop(), key=${key}, from=${from}, to=${to}, data.hitMode=${data.hitMode}, node.key=${node.key}`);
                await uiController.moveNote(
                  key,
                  from,
                  to,
                  data.hitMode,
                  node.key
                );
                data.otherNode.moveTo(node, data.hitMode);
              }
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
    loadTree,
    handleChangeTitle,
    handleChangeExpanded,
    updateDetailsNoteKey,
    handleChangeDone,
    setAddTreeNoteOnNoteKey,
    uiController,
    setReloadTreeNoteKey,
    trash,
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

  return <div className="n3-tree" ref={domRef} />;
}
