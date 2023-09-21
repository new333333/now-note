/* eslint-disable no-unused-vars */
/* eslint max-classes-per-file: ["error", 99] */
import fs from 'fs';
import { Asset, Note, Tag } from 'main/modules/DataModels';


// ***************************************************************************
// ***************************************************************************

export interface SearchResult {
  offset: number;
  limit: number;
  maxResults: number;
  results: Array<Note>;
}

export interface SearchResultOptions {
  parentNotesKey: string[];
  types: string[];
  dones: number[];
  sortBy: string;
  offset: number;
}

// ***************************************************************************
// ***************************************************************************

export interface UserSettingsRepository {
  name: string;
  path: string;
  type: string;
  default: boolean;
}

export interface UserSettings {
  repositories: Array<UserSettingsRepository>;
}

// ***************************************************************************
// ***************************************************************************

export interface RepositorySettings {
  filter: {
    onlyNotes: boolean;
    onlyTasks: boolean;
    onlyDone: boolean;
    onlyNotDone: boolean;
  };

  state: {
    details: {
      key: string | undefined;
    };
    list: {
      key: string | undefined;
    };
  };

  // v1, don't need any more
  filterOnlyNotes?: boolean;
  filterOnlyTasks?: boolean;
  filterOnlyDone?: boolean;
  filterOnlyNotDone?: boolean;
}

// ***************************************************************************
// ***************************************************************************

export interface Error {
  message: string;
}

export type HitMode = 'firstChild' | 'over' | 'after' | 'before';

export interface PriorityStatistics {
  minimum: number;
  average: number;
  mediana: number;
  maximum: number;
}

export interface NoteDTO {
  key?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  type?: string | undefined;
  createdBy?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  done?: boolean | undefined;
  priority?: number | undefined;
  expanded?: boolean | undefined;
  trash?: boolean | undefined;
  linkToKey?: string | undefined;
  // TODO: not in use?
  linkedNote?: NoteDTO | undefined;
  parents?: Array<NoteDTO> | undefined;
  position?: number | undefined;
  hasChildren?: boolean | undefined;
}

// ***************************************************************************
// ***************************************************************************

export interface Repository {
  authenticate(): Promise<void>;
  close(): Promise<void>;
  getChildren(key: string, trash: boolean): Promise<Array<Note> | undefined>;
  getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<Note | undefined>;
  getBacklinks(key: string): Promise<Array<Note>>;
  search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult>;
  modifyNote(
    note: NoteDTO,
    skipVersioning?: boolean | undefined
  ): Promise<Note | undefined>;
  findTag(tag: string): Promise<string[]>;
  addTag(key: string, tag: string): Promise<string>;
  removeTag(key: string, tag: string): Promise<string>;
  addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<Note | undefined>;
  moveNote(
    key: string,
    from: string,
    to: string,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void>;
  moveNoteToTrash(key: string): Promise<boolean>;
  restore(key: string): Promise<boolean>;
  deletePermanently(key: string): Promise<boolean>;
  getPriorityStatistics(): Promise<PriorityStatistics>;
  addFileAsNote(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<Note | undefined>;
  getAssetFileName(assetKey: string): Promise<string | undefined>;
  getAssetFileReadStream(assetKey: string): Promise<fs.ReadStream | undefined>;
  getAssetFileLocalPath(assetKey: string): Promise<string | undefined>;
  reindexAll(key: string | undefined): Promise<void>;
  addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<Asset>;
}

// ***************************************************************************
// ***************************************************************************

export interface NowNoteAPI {
  getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<Note | undefined>;
  getChildren(
    key: string | null | undefined,
    trash?: boolean
  ): Promise<Array<Note> | undefined>;
  getBacklinks(key: string): Promise<Array<Note>>;
  search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult>;
  modifyNote(note: Note): Promise<NoteDTO>;
  addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<Note | undefined>;
  moveNote(
    key: string,
    from: string,
    to: string,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void>;
  moveNoteToTrash(key: string): Promise<boolean | undefined>;
  restore(key: string): Promise<boolean | undefined>;
  deletePermanently(key: string): Promise<boolean | undefined>;

  findTag(tag: string): Promise<string[]>;
  addTag(key: string, tag: string): Promise<string>;
  removeTag(key: string, tag: string): Promise<string>;

  getPriorityStatistics(): Promise<PriorityStatistics>;

  selectRepositoryFolder(): Promise<UserSettingsRepository | Error | undefined>;
  isRepositoryInitialized(): Promise<Boolean>;
  getRepositories(): Promise<Array<UserSettingsRepository>>;
  getRepositorySettings(): Promise<RepositorySettings | undefined>;
  setRepositorySettings(settings: UserSettingsRepository): Promise<void>;
  getCurrentRepository(): Promise<UserSettingsRepository | undefined>;
  connectRepository(path: string): Promise<UserSettingsRepository | undefined>;
  closeRepository(): Promise<void>;

  reindexAll(key: string | undefined): Promise<void>;

  addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<Asset>;
}
