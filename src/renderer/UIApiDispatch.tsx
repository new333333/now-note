/* eslint-disable no-unused-vars */
import { createContext } from 'react';
import { NoteDTO, UserSettingsRepository } from 'types';

export type UIApi = {
  setRepository(repository: UserSettingsRepository): Promise<void>;

  addNote(key: string): Promise<NoteDTO | undefined>;
  deleteNote(key: string): Promise<boolean>;
  restoreNote(key: string): Promise<boolean>;

  openDetailNote(noteOrKey: NoteDTO | string): Promise<void>;
  updateDetailNote(note: NoteDTO): Promise<void>;
  updateNodeInTree(note: NoteDTO): Promise<void>;
  focusNodeInTree(key: string): Promise<void>;
  openMoveToDialog(key: string): Promise<void>;
  moveNote(key: string, moveToKey: string): Promise<void>;
};

const UIApiDispatch = createContext<UIApi | null>(null);
export default UIApiDispatch;
