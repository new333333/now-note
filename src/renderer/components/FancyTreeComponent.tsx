import React, { useCallback, forwardRef, useEffect, useRef, RefObject, useImperativeHandle } from 'react';
import log from 'electron-log';
import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';
import '../css/jquery.fancytree-now-note.css';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.glyph';
import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery.fancytree/dist/modules/jquery.fancytree.clones';
import 'jquery.fancytree/dist/modules/jquery.fancytree.table';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import '../js/jquery.fancytree.contextMenu';
import $ from 'jquery';
import {
  Fancytree,
  FancytreeNode,
  FancytreeOptions,
  EventData,
  JQueryEventObject,
  FancytreeStatic,
  NodeData,
} from 'jquery.fancytree';
import { FancyTreeComponentAPI, HitMode, NoteDTO } from 'types';

const treeLog = log.scope('Tree');

interface JQueryFancytree extends Element {
  fancytree(operation: string | FancytreeOptions): void;
}

interface JQueryUIFancytree {
  fancytree: void;
}

function Sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export abstract class FancyTreeDataProvider {
  protected fancyTree: Fancytree | undefined = undefined;

  abstract getRootNotes(): Promise<NoteDTO[] | undefined>;

  abstract getChildrenNotes(key: string): Promise<NoteDTO[] | undefined>;

  abstract getNoteWithDescription(
    key: string,
    withDescription: boolean
  ): Promise<NoteDTO | undefined>;

  async getRootNodes(): Promise<NodeData[]> {
    console.log("FancyTreeDataProvider >>> getRootNodes");
    const notes: NoteDTO[] | undefined = await this.getRootNotes();
    if (notes === undefined) {
      return [];
    }
    return notes.map((note: NoteDTO) => this.mapNoteToNode(note));
  }

  async getChildrenNodes(
    event: JQueryEventObject,
    data: EventData
  ): Promise<void> {
    data.result = async () => {
      const children = await this.getChildrenNotes(data.node.key);
      if (children === undefined) {
        return [];
      }
      return children.map((note) => this.mapNoteToNode(note));
    };
  }

  setFancyTree(fancyTree: Fancytree): void {
    this.fancyTree = fancyTree;
  }

  getActiveNodeKey(): string | undefined {
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return undefined;
    }
    let node = this.fancyTree.getActiveNode();
    if (node === null) {
      node = this.fancyTree.getRootNode();
    }
    if (node === null) {
      return undefined;
    }
    return node.key;
  }

  updateNode(nodeDTO: NoteDTO): void {
    console.log(`FancyTreeDataProvider.updateNode, nodeDTO=`, nodeDTO);
    if (
      nodeDTO === undefined ||
      nodeDTO === null ||
      nodeDTO.key === null ||
      nodeDTO.key === undefined ||
      this.fancyTree === null ||
      this.fancyTree === undefined
    ) {
      return;
    }
    const node: FancytreeNode = this.fancyTree.getNodeByKey(nodeDTO.key);
    if (node === undefined) {
      return;
    }
    node.setSelected(nodeDTO.done !== null && nodeDTO.done);
    node.data.type = nodeDTO.type;
    node.title =
      nodeDTO.title !== null && nodeDTO.title !== undefined
        ? nodeDTO.title
        : '';
    (node as any).checkbox = nodeDTO.type === 'task';
    node.renderTitle();
  }

  async addNode(newNote: NoteDTO): Promise<NoteDTO | undefined> {
    console.log('addNode() on update newNote=', newNote);
    if (newNote === undefined || newNote === null) {
      return undefined;
    }
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return undefined;
    }

    let parentNode = null;
    if (newNote.parent !== null && newNote.parent !== undefined) {
      parentNode = this.fancyTree.getNodeByKey(newNote.parent);
    } else {
      parentNode = this.fancyTree.getRootNode();
    }
    console.log('addNode() parentNode=' + parentNode);
    if (parentNode === null) {
      return undefined;
    }
    await parentNode.setExpanded(true);

    const newNode = parentNode.addNode(
      this.mapNoteToNode(newNote),
      'firstChild'
    );

    if (newNote.key !== null && newNote.key !== undefined) {
      newNode.key = newNote.key;
    }
    newNode.setActive();
    newNode.setFocus();

    return newNote;
  }

  removeNode(key: string) {
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return;
    }
    const node = this.fancyTree.getNodeByKey(key);
    if (node === null) {
      return;
    }
    node.remove();
  }

  async loadNode(key: string): Promise<FancytreeNode | undefined> {
    if (key === undefined || key === null) {
      return undefined;
    }
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return undefined;
    }
    let node = this.fancyTree.getNodeByKey(key);
    if (node === undefined || node === null) {
      const note: NoteDTO | undefined = await this.getNoteWithDescription(
        key,
        false
      );
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
          node = this.fancyTree.getNodeByKey(keys[i]);
          if (node !== undefined && node !== null) {
            while (node.isLoading()) {
              // eslint-disable-next-line no-await-in-loop
              await Sleep(500);
            }
            if (!node.isLoaded()) {
              // eslint-disable-next-line no-await-in-loop
              await node.load();
              return node;
            }
          }
        }
      }
    }
    return undefined;
  }

  async focusNode(key: string) {
    const node = await this.loadNode(key);
    if (node === undefined || node === null) {
      return;
    }
    node.setActive();
    node.setFocus();
  }

  async reloadNode(node: FancytreeNode): Promise<boolean> {
    if (node === undefined || node === null) {
      return false;
    }
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return false;
    }
    if (node.key.toLowerCase().startsWith('root')) {
      await node.resetLazy();
      await this.fancyTree.reload();
    } else {
      await node.resetLazy();
      await node.setExpanded(true);
    }
    return true;
  }

  async reload(key: string): Promise<boolean> {
    if (key === undefined || key === null) {
      return false;
    }
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return false;
    }
    const node = this.fancyTree.getNodeByKey(key);
    return this.reloadNode(node);
  }

  async move(
    key: string,
    to: string | undefined | null,
    hitMode: HitMode
  ): Promise<boolean> {
    if (key === undefined || key === null) {
      return false;
    }
    if (this.fancyTree === null || this.fancyTree === undefined) {
      return false;
    }
    const node = this.fancyTree.getNodeByKey(key);
    let moveToNode = null;
    if (to !== null && to !== undefined) {
      moveToNode = this.fancyTree.getNodeByKey(to);
    } else {
      moveToNode = this.fancyTree.getRootNode();
    }
    console.log(`move, to=, node=, moveToNode=`, to, node, moveToNode);

    if (node !== null && moveToNode !== null) {
      node.moveTo(moveToNode, hitMode);
      return true;
    }
    if (node !== null) {
      console.log(`move, node.parent=`, node.parent);
      await this.reloadNode(node.parent);
    }
    if (moveToNode !== null) {
      await this.reloadNode(moveToNode);
    }
    return true;
  }

  mapNoteToNode(note: NoteDTO): NodeData {
    // console.log(`>>>>>>>>>>>>>>>>>>>>> mapNoteToNode note=`, note);

    const node: NodeData = {
      title: note.title !== undefined && note.title !== null ? note.title : '',
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
      'searchResult',
    ].forEach((attr) => {
      if (attr in note) {
        node.data[attr] = note[attr];
      }
    });
    // console.log(
    //   `mapNoteToNode note.childrenCount=`,
    //   note.childrenCount,
    //   typeof note.childrenCount
    // );
    if (note.childrenCount === 0) {
      node.children = [];
    }

    node.unselectable = note.trash === true || note.trash === 1;
    (node as any).checkbox = note.type === 'task';
    node.selected = note.done !== undefined && (note.done === true || note.done === 1);

    // console.log(`>>>>>>>>>>>>>>>>>>>>> mapNoteToNode node=`, node);

    return node;
  }
}

interface Props {
  dataProvider: FancyTreeDataProvider;
  onClick(key: string): void;
  onSelect(key: string, isSelected: boolean): void;
  onChangeTitle(key: string, title: string): void;
  onExpand(key: string, expanded: boolean): void;
  onOpenDetailNote(key: string): void;
  readOnly: boolean;
  ref: RefObject<FancyTreeComponentAPI>;
}

const FancyTreeComponent = React.memo(
  forwardRef(function FancyTreeComponent(
    {
      dataProvider,
      onClick,
      onSelect,
      onChangeTitle,
      onExpand,
      onOpenDetailNote,
      readOnly = false,
    }: Props,
    ref
  ) {
    const domRef = useRef(null);
    const fancyTreeRef = useRef<Fancytree | null>(null);

    const initTree = useCallback(async () => {
      // treeLog.debug(`Tree.initTree()`);
      if (domRef.current === undefined || domRef.current === null) {
        return;
      }
      const $domNode: JQueryFancytree = $(
        domRef.current
      ) as unknown as JQueryFancytree;

      if ($domNode.fancytree) {
        try {
          $domNode.fancytree('destroy');
        } catch (error) {
          /* empty */
        }
      }
      console.log(`$domNode`, $domNode);
      const options: FancytreeOptions = {
        source: () => {
          return dataProvider.getRootNodes();
        },
        lazyLoad: ( event: JQueryEventObject,
          data: EventData) => {
          return dataProvider.getChildrenNodes(event, data);
        },

        extensions: ['dnd5', 'contextMenu', 'edit', 'table'],
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
            return !readOnly;
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
              onChangeTitle(data.node.key, data.input.val());
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
          // Load all lazy/unloaded expanded child nodes
          // (which will trigger `loadChildren` recursively)
          data.node.visit((subNode) => {
            if (subNode.isUndefined() && subNode.isExpanded()) {
              subNode.load();
            }
          });
        },

        init: (event: JQueryEventObject, data: EventData) => {},

        activate: (event: JQueryEventObject, data: EventData) => {},

        expand: (event: JQueryEventObject, data: EventData) => {
          onExpand(data.node.key, true);
        },

        collapse: (event: JQueryEventObject, data: EventData) => {
          onExpand(data.node.key, false);
        },

        renderNode: (event: JQueryEventObject, data: EventData) => {
          if (data.node.data.searchResult) {
            const { node } = data;
            const $span = $(node.span);
            const $title = $span.find('> span.fancytree-title');
            $title.addClass('n3-tree-node-isSearchResult');
          }
        },

        click: (event: JQueryEventObject, data: EventData): boolean => {
          // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
          // we could return false to prevent default handling, i.e. generating
          // activate, expand, or select events
          if (data.targetType === 'title') {
            onClick(data.node.key);
          }
          return true;
        },

        beforeSelect: (event: JQueryEventObject, data: EventData): boolean => {
          return !data.node.data.trash;
        },

        select: (event: JQueryEventObject, data: EventData) => {
          onSelect(data.node.key, data.node.isSelected());
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
            /*const {
              deleteNote,
              addNote,
              openMoveToDialog,
              openCreateLinkDialog,
              restoreNote,
              moveNote,
            } = uiApi;*/

            if (action === 'open') {
              await onOpenDetailNote(node.key);
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
              console.log(`FancyTreeComponent parentNodeKey=`, parentNodeKey);
              if (parentNodeKey.startsWith('root_')) {
                parentNodeKey = undefined;
              }
              console.log(`FancyTreeComponent node.key=, parentNodeKey=`, node.key, parentNodeKey);
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

          dragStart: (node, data) => {
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
            return !readOnly;
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
                // treeLog.debug(
                //  `Tree.dragDrop(), key=${key}, from=${from}, to=${to}, data.hitMode=${data.hitMode}, node.key=${node.key}`);
                if (to.startsWith('root_')) {
                  to = undefined;
                }
                // await nowNoteAPI.moveNote(key, to, data.hitMode);
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
      fancyTreeRef.current = (
        ($.ui as unknown as JQueryUIFancytree)
          .fancytree as unknown as FancytreeStatic
      ).getTree($domNode);
      dataProvider.setFancyTree(fancyTreeRef.current);
    }, [
      dataProvider,
      readOnly,
      onChangeTitle,
      onExpand,
      onClick,
      onSelect,
      onOpenDetailNote,
    ]);

    useEffect(() => {
      // treeLog.debug(`Tree->useEffect on initTree`);
      initTree();
    }, [initTree]);

    return (
      <div className="n3-tree">
        <table ref={domRef}>
          <colgroup>
            <col width="*"></col>
          </colgroup>
          <thead>
            <tr>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  })
);

export default FancyTreeComponent;
