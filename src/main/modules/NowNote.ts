import log from 'electron-log';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';
import UserSettingsService from './UserSettings/UserSettingsService';
import RepositorySQLite from './RepositorySQLite/RepositorySQLite';
import {
  UserSettingsRepository,
  HitMode,
  NoteDTO,
  PriorityStatistics,
  Repository,
  SearchResult,
  SearchResultOptions,
  SettingsDTO,
  AssetDTO,
  MoveToDTO,
  CreatedLinkInDTO,
  OpenHistoryDTO,
} from '../../types';
import RepositorySQLiteSetup from './RepositorySQLite/RepositorySQLiteSetup';
import { SQLITE3_TYPE } from './DataModels';
import AssetFilesService from './AssetFilesService';

const nowNoteLog = log.scope('NowNote');

export default class NowNote {
  private userSettingsManger: UserSettingsService;

  private currentRepository: Repository | undefined = undefined;

  private currentUserSettingsRepository: UserSettingsRepository | undefined =
    undefined;

  private userName: string;

  private processPath: string;

  constructor(
    userSettingsManger: UserSettingsService,
    userName: string,
    processPath: string
  ) {
    this.userSettingsManger = userSettingsManger;
    this.userName = userName;
    this.processPath = processPath;
  }

  async addRepository(
    repositoryFolder: string
  ): Promise<UserSettingsRepository | undefined> {
    const userSettingsRepository: UserSettingsRepository | undefined =
      await this.userSettingsManger.addRepository(
        'Now Note Repository',
        repositoryFolder,
        SQLITE3_TYPE
      );
    return userSettingsRepository;
  }

  async connectRepository(
    repository: UserSettingsRepository
  ): Promise<UserSettingsRepository> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository!.close();
    }
    if (repository.repositoryType === SQLITE3_TYPE) {
      this.currentUserSettingsRepository = repository;
      let repositoryPath = this.currentUserSettingsRepository.path;
      if (!path.isAbsolute(repositoryPath)) {
        repositoryPath = path.join(
          this.processPath,
          this.currentUserSettingsRepository.path,
          'db.sqlite3'
        );
      } else {
        repositoryPath = path.join(
          this.currentUserSettingsRepository.path,
          'db.sqlite3'
        );
      }

      nowNoteLog.debug(
        'NowNote.connectRepository() repositoryPath:',
        repositoryPath
      );
      const sequelize: Sequelize = new Sequelize({
        logging: true,
        dialect: 'sqlite',
        dialectModule: sqlite3,
        storage: repositoryPath,
      });

      const repositorySQLiteSetup: RepositorySQLiteSetup =
        new RepositorySQLiteSetup(sequelize);
      await repositorySQLiteSetup.up();

      this.currentRepository = new RepositorySQLite(
        new AssetFilesService(path.dirname(repositoryPath)),
        sequelize,
        this.userName
      );
      try {
        await this.currentRepository?.authenticate();
      } catch (error) {
        nowNoteLog.error('connectRepository error', error);
      }
      return this.currentUserSettingsRepository;
    }
    throw Error(`"${repository.repositoryType}" is unknown repository type.`);
  }

  async connectDefaultRepository(): Promise<
    UserSettingsRepository | undefined
  > {
    if (this.currentRepository !== undefined) {
      this.currentRepository!.close();
    }
    const userSettingsRepository: UserSettingsRepository | undefined =
      await this.userSettingsManger.getDefaultRepository();
    if (userSettingsRepository !== undefined) {
      return this.connectRepository(userSettingsRepository);
    }
    return undefined;
  }

  async setDefaultRepository(
    repositoryFolder: string
  ): Promise<UserSettingsRepository | undefined> {
    const userSettingsRepository: UserSettingsRepository | undefined =
      await this.userSettingsManger.setDefaultRepository(repositoryFolder);
    return userSettingsRepository;
  }

  async getDefaultRepository(): Promise<UserSettingsRepository | undefined> {
    const userSettingsRepository: UserSettingsRepository | undefined =
      await this.userSettingsManger.getDefaultRepository();
    return userSettingsRepository;
  }

  isRepositoryInitialized(): boolean {
    return this.currentRepository !== undefined;
  }

  async getRepositories(): Promise<UserSettingsRepository[] | undefined> {
    return this.userSettingsManger.getRepositories();
  }

  async getCurrentRepository(): Promise<UserSettingsRepository | undefined> {
    return Promise.resolve(this.currentUserSettingsRepository);
  }

  async getRepository(
    folder: string
  ): Promise<UserSettingsRepository | undefined> {
    return this.userSettingsManger.geRepositoryByPath(folder);
  }

  async getChildren(
    key: string,
    trash?: boolean,
    limit?: number
  ): Promise<Array<NoteDTO> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getChildren(key, trash, limit);
    }
    return Promise.resolve(undefined);
  }

  async getNext(key: string): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getNext(key);
    }
    return Promise.resolve(undefined);
  }

  async getPrevious(key: string): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getPrevious(key);
    }
    return Promise.resolve(undefined);
  }

  async getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getNoteWithDescription(
        key,
        withoutDescription
      );
    }
    return Promise.resolve(undefined);
  }

  async getBacklinks(key: string): Promise<Array<NoteDTO> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getBacklinks(key);
    }
    return Promise.resolve(undefined);
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.search(searchText, limit, trash, options);
    }
    return Promise.resolve(undefined);
  }

  async modifyNote(note: NoteDTO): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.modifyNote(note);
    }
    return Promise.resolve(undefined);
  }

  async findTag(tag: string): Promise<string[] | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.findTag(tag);
    }
    return Promise.resolve(undefined);
  }

  async addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<AssetDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addImageAsBase64(
        fileType,
        fileName,
        base64
      );
    }
    return Promise.resolve(undefined);
  }

  async addTag(key: string, tag: string): Promise<string | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addTag(key, tag);
    }
    return Promise.resolve(undefined);
  }

  async removeTag(key: string, tag: string): Promise<string | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.removeTag(key, tag);
    }
    return Promise.resolve(undefined);
  }

  async closeRepository() {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.close();
      this.currentRepository = undefined;
    }
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addNote(
        parentNoteKey,
        note,
        hitMode,
        relativeToKey
      );
    }
    return Promise.resolve(undefined);
  }

  async moveNote(
    key: string,
    to: string | undefined,
    hitMode: HitMode
  ): Promise<void> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.moveNote(key, to, hitMode);
    }
  }

  async moveNoteToTrash(key: string): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.moveNoteToTrash(key);
    }
    return Promise.resolve(undefined);
  }

  async reindex(key: string | undefined): Promise<void> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.reindex(key);
    }
  }

  async getReindexingProgress(): Promise<number | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getReindexingProgress();
    }
    return undefined;
  }

  async restore(key: string): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.restore(key);
    }
    return Promise.resolve(undefined);
  }

  async deletePermanently(key: string): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.deletePermanently(key);
    }
    return Promise.resolve(undefined);
  }

  async getPriorityStatistics(): Promise<PriorityStatistics | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getPriorityStatistics();
    }
    return Promise.resolve(undefined);
  }

  async addFileAsNote(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addFileAsNote(
        parentKey,
        filepath,
        hitMode,
        relativeToKey
      );
    }
    return Promise.resolve(undefined);
  }

  async getAssetFileName(assetKey: string): Promise<string | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getAssetFileName(assetKey);
    }
    return Promise.resolve(undefined);
  }

  async getAssetFileLocalPath(assetKey: string): Promise<string | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getAssetFileLocalPath(assetKey);
    }
    return Promise.resolve(undefined);
  }

  async getAssetFileReadStream(
    assetKey: string
  ): Promise<fs.ReadStream | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getAssetFileReadStream(assetKey);
    }
    return Promise.resolve(undefined);
  }

  async modifySettings(
    settingsDTO: SettingsDTO
  ): Promise<SettingsDTO | undefined> {
    nowNoteLog.debug(`settingsDTO=${settingsDTO}`);
    if (this.currentRepository !== undefined) {
      return this.currentRepository.modifySettings(settingsDTO);
    }
    return Promise.resolve(undefined);
  }

  async getSettings(): Promise<SettingsDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getSettings();
    }
    return Promise.resolve(undefined);
  }

  async addMoveTo(key: string | null): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addMoveTo(key);
    }
    return Promise.resolve(undefined);
  }

  async removeMoveTo(id: number): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.removeMoveTo(id);
    }
    return Promise.resolve(undefined);
  }

  async getMoveToList(): Promise<MoveToDTO[] | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getMoveToList();
    }
    return Promise.resolve(undefined);
  }

  async addCreatedLinkIn(key: string | null): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addCreatedLinkIn(key);
    }
    return Promise.resolve(undefined);
  }

  async removeCreatedLinkIn(id: number): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.removeCreatedLinkIn(id);
    }
    return Promise.resolve(undefined);
  }

  async getCreatedLinkInList(): Promise<CreatedLinkInDTO[] | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getCreatedLinkInList();
    }
    return Promise.resolve(undefined);
  }

  async addOpenHistory(key: string | null): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addOpenHistory(key);
    }
    return Promise.resolve(undefined);
  }

  async removeOpenHistory(id: number): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.removeOpenHistory(id);
    }
    return Promise.resolve(undefined);
  }

  async getOpenHistoryPrevious(
    id: number | undefined
  ): Promise<OpenHistoryDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getOpenHistoryPrevious(id);
    }
    return Promise.resolve(undefined);
  }

  async getOpenHistoryNext(
    id: number | undefined
  ): Promise<OpenHistoryDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getOpenHistoryNext(id);
    }
    return Promise.resolve(undefined);
  }
}
