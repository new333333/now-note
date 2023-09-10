import { Note } from 'main/modules/DataModels';
import { create } from 'zustand';
import { uiController } from 'renderer/UIControllerContext';
import { UserSettingsRepository } from 'types';

type State = {
  // trash open
  trash: boolean;

  // currnetly connecter repository
  currentRepository: UserSettingsRepository | undefined;

  // note displayed in details view
  detailsNote: Note | undefined;

  // note is not displayed, it's used as listener for modification of notes in tree or breadcrums (in or out)
  // used also as new add note to notify tree
  updatedNote: Note | undefined;

  // true -> set focus on title in note details view
  detailsNoteTitleFocus: boolean;

  // reload tree node
  reloadTreeNoteKey: string;

  // add note in tree on active node
  addTreeNoteOnNoteKey: string | undefined | 'ACTIVE_TREE_NODE';
};

type Action = {
  setTrash: (value: boolean) => void;
  updateDetailsNoteKey: (detailsNoteKey: string) => void;
  updateDetailsNote: (note: Note | undefined) => void;

  updateUpdatedNote: (note: Note) => void;

  setTitle: (key: string, title: string) => void;
  setExpanded: (key: string, expanded: boolean) => void;
  setDone: (key: string, done: boolean) => void;
  setDescription: (key: string, description: string) => void;
  setType: (key: string, type: string) => void;
  setPriority: (key: string, priority: number) => void;

  setDetailsNoteTitleFocus: (value: boolean) => void;

  setReloadTreeNoteKey: (key: string) => void;

  setAddTreeNoteOnNoteKey: (key: string | undefined) => void;

  setCurrentRepository: (
    repository: UserSettingsRepository | undefined | 'ACTIVE_TREE_NODE'
  ) => void;
};

const useNoteStore = create<State & Action>((set, get) => ({
  // default values
  detailsNote: undefined,
  trash: false,

  setTrash: (value: boolean) => {
    set({
      trash: value,
    });
  },

  setDetailsNoteTitleFocus: (value: boolean) => {
    set({
      detailsNoteTitleFocus: value,
    });
  },

  updateDetailsNoteKey: async (key) => {
    if (get().detailsNote === undefined || get().detailsNote.key !== key) {
      const note: Note | undefined = await uiController.getNoteWithDescription(
        key
      );
      set({
        detailsNote: note,
      });
    } else {
      // console.log('updateDetailsNoteKey SKIP set() its the same note');
    }
  },

  updateDetailsNote: (note: Note | undefined) => {
    set({
      detailsNote: note,
    });
  },

  updateUpdatedNote: (note: Note) => {
    set({
      updatedNote: note,
    });
  },

  setTitle: (key: string, title: string) => set((state) => {
    // console.log('Store setTitle');
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          title: title,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          title,
        }
      };
    };
  }),

  setExpanded: (key: string, expanded: boolean) => set((state) => {
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          expanded: expanded,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          expanded,
        }
      };
    };
  }),

  setDescription: (key: string, description: string) => set((state) => {
    // console.log('Store setTitle');
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          description: description,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          description,
        }
      };
    };
  }),

  setType: (key: string, type: string) => set((state) => {
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          type: type,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          type,
        }
      };
    };
  }),

  setPriority: (key: string, priority: number) => set((state) => {
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          priority: priority,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          priority,
        }
      };
    };
  }),

  setDone: (key: string, done: boolean) => set((state) => {
    if (get().detailsNote !== undefined && get().detailsNote.key === key) {
      return {
        detailsNote: {
          ...state.detailsNote,
          done: done,
        }
      };
    } else {
      return {
        updatedNote: {
          key,
          done,
        }
      };
    };
  }),

  setReloadTreeNoteKey: (key: string) => set(() => ({reloadTreeNoteKey: key})),

  setAddTreeNoteOnNoteKey: (key: string | undefined | 'ACTIVE_TREE_NODE') => set(() => ({addTreeNoteOnNoteKey: key})),

  setCurrentRepository: (repository: UserSettingsRepository | undefined) => set(() => ({currentRepository: repository})),

}));

export default useNoteStore;
