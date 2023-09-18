import { Note } from 'main/modules/DataModels';
import { create } from 'zustand';
import { UserSettingsRepository } from 'types';

type State = {
  // trash open
  trash: boolean;

  // currnetly connecter repository
  currentRepository: UserSettingsRepository | undefined;

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

  updateUpdatedNote: (note: Note) => void;

  setTitle: (key: string, title: string) => void;
  setExpanded: (key: string, expanded: boolean) => void;
  setDone: (key: string, done: boolean) => void;
  setDescription: (key: string, description: string) => void;
  setType: (key: string, type: string) => void;
  setPriority: (key: string, priority: number) => void;
  setTags: (key: string, tags: string) => void;

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

  updateUpdatedNote: (note: Note) => {
    set({
      updatedNote: note,
    });
  },

  setTitle: (key: string, title: string) => set((state) => {
    // console.log('Store setTitle');
    return {
      updatedNote: {
        key,
        title,
      }
    };
  }),

  setExpanded: (key: string, expanded: boolean) => set((state) => {
    return {
      updatedNote: {
        key,
        expanded,
      }
    };
  }),

  setDescription: (key: string, description: string) => set((state) => {
    // console.log('Store setTitle');
    return {
      updatedNote: {
        key,
        description,
      }
    };
  }),

  setType: (key: string, type: string) => set((state) => {
    return {
      updatedNote: {
        key,
        type,
      }
    };
  }),

  setPriority: (key: string, priority: number) => set((state) => {
    return {
      updatedNote: {
        key,
        priority,
      }
    };
  }),

  setTags: (key: string, tags: string) => set((state) => {
    return {
      updatedNote: {
        key,
        tags,
      }
    };
  }),

  setDone: (key: string, done: boolean) => set((state) => {
    return {
      updatedNote: {
        key,
        done,
      }
    };
  }),

  setReloadTreeNoteKey: (key: string) => set(() => ({reloadTreeNoteKey: key})),

  setAddTreeNoteOnNoteKey: (key: string | undefined | 'ACTIVE_TREE_NODE') => set(() => ({addTreeNoteOnNoteKey: key})),

  setCurrentRepository: (repository: UserSettingsRepository | undefined) => set(() => ({currentRepository: repository})),

}));

export default useNoteStore;
