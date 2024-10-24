import { create } from 'zustand';
import { UserSettingsRepository } from 'types';

type State = {
  // trash open
  trash: boolean;

  // search open
  search: boolean;

  // currnetly connecter repository
  currentRepository: UserSettingsRepository | undefined;
};

type Action = {
  setTrash: (value: boolean) => void;

  setSearch: (value: boolean) => void;

  setCurrentRepository: (
    repository: UserSettingsRepository | undefined
  ) => void;
};

const useNoteStore = create<State & Action>((set) => ({
  trash: false,

  search: false,

  currentRepository: undefined,

  setTrash: (value: boolean) => {
    set({
      trash: value,
    });
  },

  setSearch: (value: boolean) => {
    set({
      search: value,
    });
  },

  setCurrentRepository: (repository: UserSettingsRepository | undefined) =>
    set(() => ({ currentRepository: repository })),
}));

export default useNoteStore;
