/* eslint-disable no-unused-vars */
import log from 'electron-log';
import { NoteDTO } from 'types';
import { create } from 'zustand';

const detailsNoteStateLog = log.scope('DetailsNoteState');

type DetailsNoteState = {
  noteKey: string | null;

  title: string | null;

  description: string | null;

  parent: string | null;

  position: number | null;

  type: string | null;

  createdBy: string | null;

  done: boolean | null;

  priority: number | null;

  expanded: boolean | null;

  trash: boolean | null;

  createdAt: Date | null;

  updatedAt: Date | null;

  restoreParentKey: string | null;

  keyPath: string | null;

  titlePath: string | null;

  childrenCount: number | null;

  tags: string | null;

  backlinks: NoteDTO[];
};

type DetailsNoteAction = {
  updateTitle: (
    key: DetailsNoteState['noteKey'],
    title: DetailsNoteState['title']
  ) => void;

  updateDone: (
    key: DetailsNoteState['noteKey'],
    done: DetailsNoteState['done']
  ) => void;

  updateType: (
    key: DetailsNoteState['noteKey'],
    type: DetailsNoteState['type']
  ) => void;

  updatePriority: (
    key: DetailsNoteState['noteKey'],
    priority: DetailsNoteState['priority']
  ) => void;

  updateTags: (
    key: DetailsNoteState['noteKey'],
    tags: DetailsNoteState['tags']
  ) => void;

  updateDescription: (
    key: DetailsNoteState['noteKey'],
    description: DetailsNoteState['description']
  ) => void;

  updateExpanded: (
    key: DetailsNoteState['noteKey'],
    expanded: DetailsNoteState['expanded']
  ) => void;

  updateTrash: (trash: DetailsNoteState['trash']) => void;

  updateNote: (note: NoteDTO | undefined) => void;

  updateNoteProperties: (note: NoteDTO) => void;

  updateBacklinks: (backlinks: NoteDTO[]) => void;
};

const useDetailsNoteStore = create<DetailsNoteState & DetailsNoteAction>(
  (set, get) => ({
    noteKey: null,

    title: null,

    description: null,

    parent: null,

    position: null,

    type: null,

    createdBy: null,

    done: null,

    priority: null,

    expanded: null,

    trash: null,

    createdAt: null,

    updatedAt: null,

    restoreParentKey: null,

    keyPath: null,

    titlePath: null,

    childrenCount: null,

    tags: null,

    backlinks: [],

    updateKey: (key) => {
      detailsNoteStateLog.debug(`updateKey key=${key}`);
      set({ noteKey: key });
    },

    updateTitle: (key, title) => {
      detailsNoteStateLog.debug(`updateTitle key=${key} title=${title}`);
      if (get().noteKey === key) {
        set({
          title,
        });
      }
    },

    updateDone: (key, done) => {
      detailsNoteStateLog.debug(`updateDone key=${key} done=${done}`);
      if (get().noteKey === key) {
        set({
          done,
        });
      }
    },

    updatePriority: (key, priority) => {
      detailsNoteStateLog.debug(
        `updatePriority key=${key} priority=${priority}`
      );
      if (get().noteKey === key) {
        set({
          priority,
        });
      }
    },

    updateTags: (key, tags) => {
      detailsNoteStateLog.debug(`updateTags key=${key} tags=${tags}`);
      if (get().noteKey === key) {
        set({
          tags,
        });
      }
    },

    updateType: (key, type) => {
      detailsNoteStateLog.debug(`updateType key=${key} type=${type}`);
      if (get().noteKey === key) {
        set({
          type,
        });
      }
    },

    updateDescription: (key, description) => {
      detailsNoteStateLog.debug(
        `updateDescription key=${key} description=${description}`
      );
      if (get().noteKey === key) {
        set({
          description,
        });
      }
    },

    updateTrash: (trash) => {
      detailsNoteStateLog.debug(`updateTrash trash=${trash}`);
      set({ trash });
    },

    updateExpanded: (key, expanded) => {
      detailsNoteStateLog.debug(
        `updateExpanded key=${key} expanded=${expanded}`
      );
      if (get().noteKey === key) {
        set({
          expanded,
        });
      }
    },

    updateBacklinks: (backlinks: NoteDTO[]) => {
      detailsNoteStateLog.debug(
        `updateBacklinks backlinks.length=${backlinks.length}`
      );
      set({ backlinks });
    },

    updateNote: (note) => {
      detailsNoteStateLog.debug(`updateNote`);
      set({
        noteKey: note !== undefined ? note.key : null,
        title: note !== undefined ? note.title : null,
        description: note !== undefined ? note.description : null,
        parent: note !== undefined ? note.parent : null,
        position: note !== undefined ? note.position : null,
        type: note !== undefined ? note.type : null,
        createdBy: note !== undefined ? note.createdBy : null,
        done: note !== undefined ? note.done : null,
        priority: note !== undefined ? note.priority : null,
        expanded: note !== undefined ? note.expanded : null,
        trash: note !== undefined ? note.trash : null,
        createdAt: note !== undefined ? note.createdAt : null,
        updatedAt: note !== undefined ? note.updatedAt : null,
        restoreParentKey: note !== undefined ? note.restoreParentKey : null,
        keyPath: note !== undefined ? note.keyPath : null,
        titlePath: note !== undefined ? note.titlePath : null,
        childrenCount: note !== undefined ? note.childrenCount : null,
        tags: note !== undefined ? note.tags : null,
      });
    },

    updateNoteProperties: (note) => {
      detailsNoteStateLog.debug(`updateNoteProperties`);
      if (get().noteKey === note.key) {
        set({
          title: note.title,
          description: note.description,
          parent: note.parent,
          position: note.position,
          type: note.type,
          createdBy: note.createdBy,
          done: note.done,
          priority: note.priority,
          expanded: note.expanded,
          trash: note.trash,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          restoreParentKey: note.restoreParentKey,
          keyPath: note.keyPath,
          titlePath: note.titlePath,
          childrenCount: note.childrenCount,
          tags: note.tags,
        });
      }
    },
  })
);

export default useDetailsNoteStore;
