/* eslint-disable no-unused-vars */
import { createContext } from 'react';
import { NoteDTO } from 'types';

export type UIApi = {
  addNote(key: string): Promise<NoteDTO | undefined>;
  deleteNote(key: string): Promise<boolean>;
  openDetailNote(note: NoteDTO): Promise<void>;
  updateDetailNote(note: NoteDTO): Promise<void>;
  updateNodeInTree(note: NoteDTO): Promise<void>;
  focusNodeInTree(key: string): Promise<void>;
};

const UIApiDispatch = createContext<UIApi>(null);
export default UIApiDispatch;
