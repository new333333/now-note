import log from 'electron-log';
import {
  HitMode,
  NoteDTO,
  PriorityStatistics,
  SearchResult,
  SearchResultOptions,
  UserSettingsRepository,
  Error,
  NowNoteAPI,
  AssetDTO,
  SettingsDTO,
  MoveToDTO,
} from 'types';

const nowNoteAPILog = log.scope('NowNoteAPI');

export class NowNoteAPIImpl implements NowNoteAPI {
  private îpcRenderer: any;

  constructor(îpcRenderer: any) {
    this.îpcRenderer = îpcRenderer;
  }

  async getPriorityStatistics(): Promise<PriorityStatistics> {
    const priorityStat: PriorityStatistics =
      await this.îpcRenderer.getPriorityStatistics();
    return priorityStat;
  }

  async getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<NoteDTO | undefined> {
    const note: NoteDTO | undefined =
      await this.îpcRenderer.getNoteWithDescription(key, withoutDescription);
    return note;
  }

  async getChildren(
    key: string,
    trash: boolean
  ): Promise<NoteDTO[] | undefined> {
    const children: NoteDTO[] | undefined = await this.îpcRenderer.getChildren(
      key,
      trash
    );
    return children;
  }

  async getBacklinks(key: string): Promise<NoteDTO[] | undefined> {
    const backlinks: NoteDTO[] | undefined =
      await this.îpcRenderer.getBacklinks(key);
    return backlinks;
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult> {
    const searchResult: SearchResult = await this.îpcRenderer.search(
      searchText,
      limit,
      trash,
      options
    );
    return searchResult;
  }

  async modifyNote(note: NoteDTO): Promise<NoteDTO> {
    return this.îpcRenderer.modifyNote(note);
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    return this.îpcRenderer.addNote(
      parentNoteKey,
      note,
      hitMode,
      relativeToKey
    );
  }

  async moveNote(
    key: string,
    to: string,
    hitMode: HitMode,
    relativTo: string | undefined
  ): Promise<void> {
    return this.îpcRenderer.moveNote(key, to, hitMode, relativTo);
  }

  async moveNoteToTrash(key: string): Promise<boolean | undefined> {
    return this.îpcRenderer.moveNoteToTrash(key);
  }

  async restore(key: string): Promise<boolean | undefined> {
    return this.îpcRenderer.restore(key);
  }

  async deletePermanently(key: string): Promise<boolean | undefined> {
    return this.îpcRenderer.deletePermanently(key);
  }

  async findTag(tag: string): Promise<string[]> {
    const tags = await this.îpcRenderer.findTag(tag);
    return tags;
  }

  async addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<AssetDTO> {
    const asset = await this.îpcRenderer.addImageAsBase64(
      fileType,
      fileName,
      base64
    );
    return asset;
  }

  async addTag(key: string, tag: string): Promise<string> {
    return this.îpcRenderer.addTag(key, tag);
  }

  async removeTag(key: string, tag: string): Promise<string> {
    const currentTags: string = await this.îpcRenderer.removeTag(key, tag);
    return currentTags;
  }

  async selectRepositoryFolder(): Promise<
    UserSettingsRepository | Error | undefined
  > {
    return this.îpcRenderer.selectRepositoryFolder();
  }

  async isRepositoryInitialized(): Promise<Boolean> {
    return this.îpcRenderer.isRepositoryInitialized();
  }

  async getRepositories(): Promise<Array<UserSettingsRepository>> {
    return this.îpcRenderer.getRepositories();
  }

  async getCurrentRepository(): Promise<UserSettingsRepository | undefined> {
    return this.îpcRenderer.getCurrentRepository();
  }

  async connectRepository(
    path: string
  ): Promise<UserSettingsRepository | undefined> {
    return this.îpcRenderer.connectRepository(path);
  }

  async modifySettings(settingsDTO: SettingsDTO): Promise<SettingsDTO> {
    nowNoteAPILog.debug(`settingsDTO=${settingsDTO}`);
    return this.îpcRenderer.modifySettings(settingsDTO);
  }

  async getSettings(): Promise<SettingsDTO> {
    return this.îpcRenderer.getSettings();
  }

  async addMoveTo(key: string | null): Promise<void> {
    return this.îpcRenderer.addMoveTo(key);
  }

  async removeMoveTo(id: number): Promise<void> {
    return this.îpcRenderer.removeMoveTo(id);
  }

  async getMoveToList(): Promise<MoveToDTO[]> {
    return this.îpcRenderer.getMoveToList();
  }

  async closeRepository(): Promise<void> {
    return this.îpcRenderer.closeRepository();
  }

  async reindex(key: string | undefined): Promise<void> {
    return this.îpcRenderer.reindex(key);
  }

  async getReindexingProgress(): Promise<number> {
    return this.îpcRenderer.getReindexingProgress();
  }

  async addFileAsNote(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined> {
    return this.îpcRenderer.addFileAsNote(
      parentKey,
      filepath,
      hitMode,
      relativeToKey
    );
  }
}

export const nowNoteAPI = new NowNoteAPIImpl(window.electron.ipcRenderer);
