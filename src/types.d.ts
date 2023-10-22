/* eslint-disable no-unused-vars */
/* eslint max-classes-per-file: ["error", 99] */
import fs from 'fs';

// ***************************************************************************
// ***************************************************************************

export interface UserSettingsRepository {
  name: string;
  path: string;
  repositoryType: string;
  default: boolean;
}

export interface UserSettings {
  repositories: UserSettingsRepository[];
}

// ***************************************************************************
// ***************************************************************************

export interface Error {
  message: string;
}

export type HitMode =
  | 'firstChild'
  | 'over'
  | 'after'
  | 'before'
  | 'up'
  | 'down';

export interface PriorityStatistics {
  minimum: number;
  average: number;
  mediana: number;
  maximum: number;
}

export interface NoteDTO {
  key?: string | null;
  title?: string | null;
  description?: string | null;
  parent?: string | null;
  position?: number | null;
  type?: string | null;
  createdBy?: string | null;
  done?: boolean | null;
  priority?: number | null;
  expanded?: boolean | null;
  trash?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  restoreParentKey?: string | null;
  keyPath?: string;
  titlePath?: string;
  childrenCount?: number;
  tags?: string | null;
}

export interface AssetDTO {
  key?: string | null;
  type: string | null;
  name: string | null;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SettingsDTO {
  detailsNoteKey?: string | null;
}

export interface MoveToDTO {
  id?: number;
  key?: string | null;
}

export interface CreatedLinkInDTO {
  id?: number;
  key?: string | null;
}

// ***************************************************************************
// ***************************************************************************

export interface SearchResult {
  offset: number;
  limit: number;
  maxResults: number;
  results: Array<NoteDTO>;
}

export interface SearchResultOptions {
  parentNotesKey: string[];
  excludeParentNotesKey: string[];
  excludeNotesKey: string[];
  types: string[];
  dones: number[];
  sortBy: string;
  offset: number;
}

// ***************************************************************************
// ***************************************************************************

export interface Repository {
  authenticate(): Promise<void>;
  close(): Promise<void>;
  getChildren(
    key: string,
    trash?: boolean,
    limit?: number
  ): Promise<Array<NoteDTO> | undefined>;
  getNext(key: string): Promise<NoteDTO | undefined>;
  getPrevious(key: string): Promise<NoteDTO | undefined>;
  getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<NoteDTO | undefined>;
  getBacklinks(key: string): Promise<Array<NoteDTO> | undefined>;
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
  findTag(tag: string): Promise<string[]>;
  addTag(key: string, tag: string): Promise<string>;
  removeTag(key: string, tag: string): Promise<string>;
  addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined>;
  moveNote(
    key: string,
    to: string | undefined,
    hitMode: HitMode
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
  ): Promise<NoteDTO | undefined>;
  getAssetFileName(assetKey: string): Promise<string | undefined>;
  getAssetFileReadStream(assetKey: string): Promise<fs.ReadStream | undefined>;
  getAssetFileLocalPath(assetKey: string): Promise<string | undefined>;
  reindex(key: string | undefined): Promise<void>;
  getReindexingProgress(): Promise<number | undefined>;
  addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<AssetDTO>;
  modifySettings(settingsDTO: SettingsDTO): Promise<SettingsDTO | undefined>;
  getSettings(): Promise<SettingsDTO | undefined>;

  addMoveTo(key: string | null): Promise<void | undefined>;
  removeMoveTo(id: number): Promise<void | undefined>;
  getMoveToList(): Promise<MoveToDTO[] | undefined>;

  addCreatedLinkIn(key: string | null): Promise<void | undefined>;
  removeCreatedLinkIn(id: number): Promise<void | undefined>;
  getCreatedLinkInList(): Promise<CreatedLinkInDTO[] | undefined>;
}

// ***************************************************************************
// ***************************************************************************

export interface NowNoteAPI {
  getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<NoteDTO | undefined>;
  getChildren(
    key: string | null | undefined,
    trash?: boolean,
    limit?: number
  ): Promise<Array<NoteDTO> | undefined>;
  getNext(key: string): Promise<NoteDTO | undefined>;
  getPrevious(key: string): Promise<NoteDTO | undefined>;
  getBacklinks(key: string): Promise<Array<NoteDTO> | undefined>;
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
    hitMode: HitMode
  ): Promise<NoteDTO | undefined>;
  moveNote(
    key: string,
    to: string | undefined,
    hitMode: HitMode,
    relativTo: string | undefined
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
  getCurrentRepository(): Promise<UserSettingsRepository | undefined>;
  connectRepository(path: string): Promise<UserSettingsRepository | undefined>;
  closeRepository(): Promise<void>;

  reindex(key: string | undefined): Promise<void>;
  getReindexingProgress(): Promise<number | undefined>;

  addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<AssetDTO>;

  addFileAsNote(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined>;

  modifySettings(settingsDTO: SettingsDTO): Promise<SettingsDTO | undefined>;
  getSettings(): Promise<SettingsDTO | undefined>;

  addMoveTo(key: string | null): Promise<void | undefined>;
  removeMoveTo(id: number): Promise<void | undefined>;
  getMoveToList(): Promise<MoveToDTO[] | undefined>;

  addCreatedLinkIn(key: string | null): Promise<void | undefined>;
  removeCreatedLinkIn(id: number): Promise<void | undefined>;
  getCreatedLinkInList(): Promise<CreatedLinkInDTO[] | undefined>;
}

export interface TreeComponentAPI {
  getActiveNodeKey(): string | undefined;
  addNode(newNote: NoteDTO): Promise<NoteDTO | undefined>;
  removeNode(key: string): Promise<NoteDTO | undefined>;
  updateNode(note: NoteDTO): Promise<void>;
  focusNode(key: string): Promise<void>;
  reloadNode(key: string): Promise<boolean>;
  move(key: string, to: string | undefined, hitMode: HitMode): Promise<boolean>;
}

export interface DetailsNoteComponentAPI {
  setFocus(): Promise<void>;
}

export interface MoveToModalComponentAPI {
  open(key: string): Promise<void>;
}

export interface CreateLinkModalComponentAPI {
  open(key: string): Promise<void>;
}
