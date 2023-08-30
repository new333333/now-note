import { Note } from 'main/modules/DataModels';
import { create } from 'zustand';
import { uiController } from 'renderer/UIControllerContext';
import { NoteDTO } from 'types';

type State = {
  detailsNote: Note | undefined;
};

type Action = {
  updateDetailsNoteKey: (detailsNoteKey: string) => void;
  updateDetailsNote: (note: Note) => void;

  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setType: (type: string) => void;
  setPriority: (priority: number) => void;
  setDone: (done: boolean) => void;
};

const useNoteStore = create<State & Action>((set, get) => ({
  detailsNote: undefined,

  updateDetailsNoteKey: async (key) => {
    if (get().detailsNote === undefined || get().detailsNote.key !== key) {
      const note: Note | undefined = await uiController.getNote(key);
      set({
        detailsNote: note,
      });
    } else {
      console.log('updateDetailsNoteKey SKIP set() its the same note');
    }
  },

  updateDetailsNote: (note: Note) => {
    set({
      detailsNote: note,
    });
  },

  setTitle: (title: string) => set((state) => ({
    detailsNote: {
      ...state.detailsNote,
      title: title
    }
  })),

  setDescription: (description: string) => set((state) => ({
    detailsNote: {
      ...state.detailsNote,
      description: description
    }
  })),

  setType: (type: string) => set((state) => ({
    detailsNote: {
      ...state.detailsNote,
      type: type
    }
  })),

  setPriority: (priority: number) => set((state) => ({
    detailsNote: {
      ...state.detailsNote,
      priority: priority
    }
  })),

  setDone: (done: boolean) => set((state) => ({
    detailsNote: {
      ...state.detailsNote,
      done: done
    }
  })),

}));

export default useNoteStore;
