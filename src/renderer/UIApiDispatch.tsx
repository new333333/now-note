/* eslint-disable no-unused-vars */
import { createContext } from 'react';
import { HitMode, NoteDTO, UserSettingsRepository } from 'types';

export type UIApi = {
  setRepository(repository: UserSettingsRepository): Promise<void>;

  addNote(key: string): Promise<NoteDTO | undefined>;
  deleteNote(key: string): Promise<boolean>;
  restoreNote(key: string): Promise<boolean>;

  openDetailNote(
    noteOrKey: NoteDTO | string,
    ignoreHistory?: boolean
  ): Promise<void>;
  openDetailsPrevious(id: number | undefined): Promise<number | undefined>;
  openDetailsNext(id: number | undefined): Promise<number | undefined>;
  updateDetailNote(note: NoteDTO): Promise<void>;
  updateNodeInTree(note: NoteDTO): Promise<void>;
  focusNodeInTree(key: string): Promise<void>;
  openMoveToDialog(key: string): Promise<void>;
  openCreateLinkDialog(key: string): Promise<void>;
  moveNote(key: string, moveToKey?: string, hitMode?: HitMode): Promise<void>;
  createLinkNote(key: string, parentKey: string): Promise<void>;
};

const UIApiDispatch = createContext<UIApi>(null);
export default UIApiDispatch;
