// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import {
  Error,
  HitMode,
  NoteDTO,
  UserSettingsRepository,
  SearchResult,
  SearchResultOptions,
  Repository,
  RepositorySettings,
} from '../types';
import { Note, Tag } from './modules/DataModels';

export interface ElectronIPCRenderer {
  ipcRenderer: Repository;
}

const electronHandler: ElectronIPCRenderer = {
  ipcRenderer: {
    selectRepositoryFolder: (): Promise<UserSettingsRepository | Error> =>
      ipcRenderer.invoke('selectRepositoryFolder'),

    isRepositoryInitialized: (): Promise<Boolean> =>
      ipcRenderer.invoke('isRepositoryInitialized'),

    getRepositories: (): Promise<Array<UserSettingsRepository>> =>
      ipcRenderer.invoke('getRepositories'),

    getRepositorySettings: (): Promise<RepositorySettings | undefined> =>
      ipcRenderer.invoke('getRepositorySettings'),

    setRepositorySettings: (settings: UserSettingsRepository) =>
      ipcRenderer.invoke('setRepositorySettings', settings),

    getCurrentRepository: (): Promise<UserSettingsRepository | undefined> =>
      ipcRenderer.invoke('getCurrentRepository'),

    getChildren: (
      key: string,
      trash: boolean
    ): Promise<Array<Note> | undefined> =>
      ipcRenderer.invoke('getChildren', key, trash),

    getNoteWithDescription: (key: string): Promise<Note | undefined> =>
      ipcRenderer.invoke('getNoteWithDescription', key),

    getParents: (key: string): Promise<Array<Note> | undefined> =>
      ipcRenderer.invoke('getParents', key),

    getBacklinks: (key: string): Promise<Array<Note>> =>
      ipcRenderer.invoke('getBacklinks', key),

    search: (
      searchText: string,
      limit: number,
      trash: boolean,
      options: SearchResultOptions
    ): Promise<SearchResult> =>
      ipcRenderer.invoke('search', searchText, limit, trash, options),

    modifyNote: (note: NoteDTO): Promise<NoteDTO> =>
      ipcRenderer.invoke('modifyNote', note),

    connectRepository: (
      repositoryFolder: string
    ): Promise<UserSettingsRepository | undefined> =>
      ipcRenderer.invoke('connectRepository', repositoryFolder),

    findTag: (tag: string): Promise<string[]> =>
      ipcRenderer.invoke('findTag', tag),

    addTag: (key: string, tag: string): Promise<string> =>
      ipcRenderer.invoke('addTag', key, tag),

    removeTag: (key: string, tag: string): Promise<string> =>
      ipcRenderer.invoke('removeTag', key, tag),

    closeRepository: () => ipcRenderer.invoke('closeRepository'),

    addNote: (
      parentNoteKey: string,
      note: NoteDTO,
      hitMode: HitMode,
      relativeToKey?: string
    ): Promise<Note | undefined> =>
      ipcRenderer.invoke(
        'addNote',
        parentNoteKey,
        note,
        hitMode,
        relativeToKey
      ),

    moveNote: (
      key: string,
      from: string,
      to: string,
      hitMode: HitMode,
      relativTo: string
    ): Promise<void> =>
      ipcRenderer.invoke('moveNote', key, from, to, hitMode, relativTo),

    moveNoteToTrash: (key: string): Promise<boolean | undefined> =>
      ipcRenderer.invoke('moveNoteToTrash', key),

    restore: (key: string): Promise<boolean | undefined> =>
      ipcRenderer.invoke('restore', key),

    deletePermanently: (key: string): Promise<boolean | undefined> =>
      ipcRenderer.invoke('deletePermanently', key),

    reindexAll: (key: string | undefined): Promise<void> =>
      ipcRenderer.invoke('reindexAll'),

    getPriorityStatistics: () => ipcRenderer.invoke('getPriorityStatistics'),

    addFile: (
      parentKey: string,
      path: string,
      hitMode: HitMode,
      relativeToKey: string
    ) => ipcRenderer.invoke('addFile', parentKey, path, hitMode, relativeToKey),

    openAssetFile: (url: string) => ipcRenderer.invoke('openAssetFile', url),

    quit: () => ipcRenderer.invoke('quit'),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

