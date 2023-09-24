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
  AssetDTO,
  SettingsDTO,
  NowNoteAPI,
} from '../types';

export interface ElectronIPCRenderer {
  ipcRenderer: NowNoteAPI;
}

const electronHandler: ElectronIPCRenderer = {
  ipcRenderer: {
    selectRepositoryFolder: (): Promise<
      UserSettingsRepository | Error | undefined
    > => ipcRenderer.invoke('selectRepositoryFolder'),

    isRepositoryInitialized: (): Promise<Boolean> =>
      ipcRenderer.invoke('isRepositoryInitialized'),

    getRepositories: (): Promise<Array<UserSettingsRepository>> =>
      ipcRenderer.invoke('getRepositories'),

    getCurrentRepository: (): Promise<UserSettingsRepository | undefined> =>
      ipcRenderer.invoke('getCurrentRepository'),

    getChildren: (
      key: string,
      trash: boolean
    ): Promise<Array<NoteDTO> | undefined> =>
      ipcRenderer.invoke('getChildren', key, trash),

    getNoteWithDescription: (
      key: string,
      withoutDescription?: boolean
    ): Promise<NoteDTO | undefined> =>
      ipcRenderer.invoke('getNoteWithDescription', key, withoutDescription),

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

    findTag: (tag: string): Promise<string[]> =>
      ipcRenderer.invoke('findTag', tag),

    addImageAsBase64: (
      fileType: string | null,
      fileName: string,
      base64: string
    ): Promise<AssetDTO> =>
      ipcRenderer.invoke('addImageAsBase64', fileType, fileName, base64),

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
    ): Promise<NoteDTO | undefined> =>
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

    moveNoteToTrash: (key: string): Promise<boolean> =>
      ipcRenderer.invoke('moveNoteToTrash', key),

    restore: (key: string): Promise<boolean> =>
      ipcRenderer.invoke('restore', key),

    deletePermanently: (key: string): Promise<boolean> =>
      ipcRenderer.invoke('deletePermanently', key),

    reindexAll: (key: string | undefined): Promise<void> =>
      ipcRenderer.invoke('reindexAll'),

    getPriorityStatistics: () => ipcRenderer.invoke('getPriorityStatistics'),

    addFileAsNote: (
      parentKey: string,
      path: string,
      hitMode: HitMode,
      relativeToKey: string
    ) =>
      ipcRenderer.invoke(
        'addFileAsNote',
        parentKey,
        path,
        hitMode,
        relativeToKey
      ),

    modifySettings: (settingsDTO: SettingsDTO) =>
      ipcRenderer.invoke('modifySettings', settingsDTO),

    getSettings: () => ipcRenderer.invoke('getSettings'),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
