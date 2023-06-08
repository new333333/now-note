/* eslint-disable no-unused-vars */
/* eslint max-classes-per-file: ["error", 99] */
import fs from 'fs';
import { Note, Tag } from 'main/modules/DataModels';
import { inflateRaw } from 'zlib';


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

export interface RepositoryDTO {
  name: string;
  directory: string;
  type: string;
  default: Boolean;
}

export interface Error {
  message: string;
}

export type HitMode = 'firstChild' | 'over' | 'after' | 'before';

export interface PriorityStatDTO {
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
  linkedNote?: NoteDTO | undefined;
  parents?: Array<NoteDTO> | undefined;
  position?: number | undefined;
  hasChildren?: boolean | undefined;
}

// ***************************************************************************
// ***************************************************************************

export type FileTransferType = 'base64' | 'path';

export interface Repository {
  open(): Promise<void>;
  close(): Promise<void>;
  getChildren(key: string, trash: boolean): Promise<Array<Note> | undefined>;
  getNote(key: string): Promise<NoteDTO | undefined>;
  getParents(
    key: string,
    parents: Array<Note> | undefined
  ): Promise<Array<Note> | undefined>;
  getBacklinks(key: string): Promise<Array<NoteDTO>>;
  getTags(key: string): Promise<Array<Tag>>;
  search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult>;
  modifyNote(
    note: NoteDTO,
    skipVersioning?: boolean | undefined
  ): Promise<NoteDTO | undefined>;
  findTag(tag: string): Promise<Tag[]>;
  addTag(key: string, tag: string): Promise<void>;
  removeTag(key: string, tag: string): Promise<string[]>;
  addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined>;
  moveNote(
    key: string,
    from: string,
    to: string,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void>;
  moveNoteToTrash(key: string): Promise<boolean>;
  restore(key: string): Promise<boolean>;
  deletePermanently(
    key: string,
    skipUpdatePosition?: boolean
  ): Promise<boolean>;
  getPriorityStat(): Promise<PriorityStatDTO>;
  addFile(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined>;
  getAssetFileName(assetKey: string): Promise<string | undefined>;
  getAssetFileReadStream(assetKey: string): Promise<fs.ReadStream | undefined>;
  getAssetFileLocalPath(assetKey: string): Promise<string | undefined>;
  reindexAll(): Promise<void>;
}

// ***************************************************************************
// ***************************************************************************

export interface NoteService {
  getNote(key: string): Promise<Note | undefined>;
  getChildren(key: string, trash: boolean): Promise<Array<Note> | undefined>;
  getParents(key: string): Promise<Array<Note> | undefined>;
  getBacklinks(key: string): Promise<Array<NoteDTO>>;
  search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult>;
  modifyNote(note: NoteDTO): Promise<NoteDTO>;
  addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined>;
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
}

export interface TagService {
  getTags(key: string): Promise<Array<Tag>>;
  findTag(tag: string): Promise<Tag[]>;
  addTag(key: string, tag: string): Promise<void>;
  removeTag(key: string, tag: string): Promise<string[]>;
}

export interface PriorityService {
  getPriorityStat(): Promise<PriorityStatDTO>;
}

export interface DataService extends NoteService, TagService, PriorityService {}

export type ListenerWhen = 'before' | 'after';

export interface DataServiceListener {
  subscribe(title: string, when: ListenerWhen, callback: Function): void;
  unsubscribe(title: string, when: ListenerWhen, callback: Function): void;
}
