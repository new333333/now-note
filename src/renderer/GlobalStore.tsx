import { create } from 'zustand';
import { UserSettingsRepository } from 'types';

type State = {
  // trash open
  trash: boolean;

  // currnetly connecter repository
  currentRepository: UserSettingsRepository | undefined;
};

type Action = {
  setTrash: (value: boolean) => void;

  setCurrentRepository: (
    repository: UserSettingsRepository | undefined
  ) => void;
};

const useNoteStore = create<State & Action>((set) => ({
  // default values
  trash: false,

  currentRepository: undefined,

  setTrash: (value: boolean) => {
    set({
      trash: value,
    });
  },

  setCurrentRepository: (repository: UserSettingsRepository | undefined) =>
    set(() => ({ currentRepository: repository })),
}));

export default useNoteStore;
