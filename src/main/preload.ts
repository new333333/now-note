// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { RepositorySettings } from './modules/RepositorySettings/RepositorySettingsService';
import {
  Error,
  HitMode,
  NoteDTO,
  RepositoryDTO,
  UserSettingsRepository,
  SearchResult,
  SearchResultOptions,
  TagService,
} from '../types';
import { Note, Tag } from './modules/DataModels';

export interface DataService {
  ipcRenderer: TagService | any;
}

const electronHandler: DataService = {
  ipcRenderer: {
    selectRepositoryFolder: (): Promise<RepositoryDTO | Error> =>
      ipcRenderer.invoke('selectRepositoryFolder'),

    isRepositoryInitialized: (): Promise<Boolean> =>
      ipcRenderer.invoke('isRepositoryInitialized'),

    getRepositories: (): Promise<Array<RepositoryDTO>> =>
      ipcRenderer.invoke('getRepositories'),

    getRepositorySettings: (): Promise<RepositorySettings | undefined> =>
      ipcRenderer.invoke('getRepositorySettings'),

    setRepositorySettings: (settings: RepositoryDTO) =>
      ipcRenderer.invoke('setRepositorySettings', settings),

    getCurrentRepository: (): Promise<UserSettingsRepository | undefined> =>
      ipcRenderer.invoke('getCurrentRepository'),

    getChildren: (
      key: string,
      trash: boolean
    ): Promise<Array<Note> | undefined> =>
      ipcRenderer.invoke('getChildren', key, trash),

    getNote: (key: string): Promise<Note | undefined> =>
      ipcRenderer.invoke('getNote', key),

    getParents: (key: string): Promise<Array<Note> | undefined> =>
      ipcRenderer.invoke('getParents', key),

    getBacklinks: (key: string): Promise<Array<NoteDTO>> =>
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

    getTags: (key: string): Promise<Array<Tag>> =>
      ipcRenderer.invoke('getTags', key),

    findTag: (tag: string): Promise<Tag[]> =>
      ipcRenderer.invoke('findTag', tag),

    addTag: (key: string, tag: string): Promise<void> =>
      ipcRenderer.invoke('addTag', key, tag),

    removeTag: (key: string, tag: string): Promise<string[]> =>
      ipcRenderer.invoke('removeTag', key, tag),

    closeRepository: () => ipcRenderer.invoke('closeRepository'),

    addNote: (
      parentNoteKey: string,
      note: NoteDTO,
      hitMode: HitMode,
      relativeToKey: string
    ) =>
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
    ) => ipcRenderer.invoke('moveNote', key, from, to, hitMode, relativTo),

    moveNoteToTrash: (key: string) =>
      ipcRenderer.invoke('moveNoteToTrash', key),

    restore: (key: string) => ipcRenderer.invoke('restore', key),

    deletePermanently: (key: string) =>
      ipcRenderer.invoke('deletePermanently', key),

    getPriorityStat: () => ipcRenderer.invoke('getPriorityStat'),

    addFile: (
      parentKey: string,
      path: string,
      hitMode: HitMode,
      relativeToKey: string
    ) => ipcRenderer.invoke('addFile', parentKey, path, hitMode, relativeToKey),

    openAssetFile: (url: string) => ipcRenderer.invoke('openAssetFile', url),

    quit: () => ipcRenderer.invoke('quit'),

    setDirty: (dirty: boolean) => ipcRenderer.invoke('setDirty', dirty),

    onClose: (callback) => ipcRenderer.on('wantClose', callback),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

