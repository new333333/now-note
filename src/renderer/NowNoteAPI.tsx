import { Asset, Note } from 'main/modules/DataModels';
import {
  HitMode,
  NoteDTO,
  PriorityStatistics,
  SearchResult,
  SearchResultOptions,
  UserSettingsRepository,
  Error,
  RepositorySettings,
  NowNoteAPI,
} from 'types';

export class NowNoteAPIImpl implements NowNoteAPI {
  private îpcRenderer: UIController;

  constructor(îpcRenderer: UIController) {
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
  ): Promise<Note | undefined> {
    const note: Note | undefined =
      await this.îpcRenderer.getNoteWithDescription(key, withoutDescription);
    return note;
  }

  async getChildren(key: string, trash: boolean): Promise<Note[] | undefined> {
    const children: Note[] | undefined = await this.îpcRenderer.getChildren(
      key,
      trash
    );
    return children;
  }

  async getBacklinks(key: string): Promise<Note[]> {
    const backlinks: Note[] | undefined = await this.îpcRenderer.getBacklinks(
      key
    );
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

  async modifyNote(note: NoteDTO): Promise<Note> {
    return this.îpcRenderer.modifyNote(note);
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<Note | undefined> {
    return this.îpcRenderer.addNote(
      parentNoteKey,
      note,
      hitMode,
      relativeToKey
    );
  }

  async moveNote(
    key: string,
    from: string,
    to: string,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void> {
    return this.îpcRenderer.moveNote(key, from, to, hitMode, relativTo);
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
  ): Promise<Asset> {
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

  async getRepositorySettings(): Promise<RepositorySettings | undefined> {
    return this.îpcRenderer.getRepositorySettings();
  }

  async setRepositorySettings(settings: UserSettingsRepository): Promise<void> {
    return this.îpcRenderer.setRepositorySettings(settings);
  }

  async getCurrentRepository(): Promise<UserSettingsRepository | undefined> {
    return this.îpcRenderer.getCurrentRepository();
  }

  async connectRepository(
    path: string
  ): Promise<UserSettingsRepository | undefined> {
    return this.îpcRenderer.connectRepository(path);
  }

  async closeRepository(): Promise<void> {
    return this.îpcRenderer.closeRepository();
  }

  async reindexAll(key: string | undefined): Promise<void> {
    return this.îpcRenderer.reindexAll(key);
  }
}

export const nowNoteAPI = new NowNoteAPIImpl(window.electron.ipcRenderer);
