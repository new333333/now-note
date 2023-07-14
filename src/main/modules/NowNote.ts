import log from 'electron-log';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';
import UserSettingsService from './UserSettings/UserSettingsService';
import {
  RepositorySQLite,
  SQLITE3_TYPE,
} from './RepositorySQLite/RepositorySQLite';
import {
  UserSettingsRepository,
  HitMode,
  NoteDTO,
  PriorityStatDTO,
  Repository,
  SearchResult,
  SearchResultOptions,
} from '../../types';
import RepositorySettingsService from './RepositorySettings/RepositorySettingsService';
import RepositorySQLiteSetup from './RepositorySQLite/RepositorySQLiteSetup';
import { Note, Tag } from './DataModels';
import AssetFilesService from './AssetFilesService';

export default class NowNote {
  private isDirty: boolean = true;

  private userSettingsManger: UserSettingsService;

  private currentRepositorySettingsService:
    | RepositorySettingsService
    | undefined = undefined;

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
      this.currentRepository!.close();
    }
    if (repository.type === SQLITE3_TYPE) {
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

      log.debug('NowNote.connectRepository() repositoryPath:', repositoryPath);
      const sequelize: Sequelize = new Sequelize({
        logging: true,
        dialect: 'sqlite',
        dialectModule: sqlite3,
        storage: repositoryPath,
      });

      const repositorySQLiteSetup: RepositorySQLiteSetup =
        new RepositorySQLiteSetup(sequelize);
      repositorySQLiteSetup.up();

      this.currentRepository = new RepositorySQLite(
        new AssetFilesService(repositoryPath),
        sequelize,
        this.userName
      );
      try {
        await this.currentRepository?.open();
      } catch (error) {
        log.error('connectRepository error', error);
      }
      this.currentRepositorySettingsService = new RepositorySettingsService(
        this.currentUserSettingsRepository.path
      );
      return this.currentUserSettingsRepository;
    }
    throw Error(`"${repository.type}" is unknown repository type.`);
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

  setDirty(dirty: boolean) {
    this.isDirty = dirty;
  }

  getIsDirty() {
    return this.isDirty;
  }

  isRepositoryInitialized(): boolean {
    return this.currentRepository !== undefined;
  }

  async getRepositories(): Promise<UserSettingsRepository[] | undefined> {
    return this.userSettingsManger.getRepositories();
  }

  async getRepositorySettings(): Promise<RepositorySettings | undefined> {
    if (this.currentRepositorySettingsService !== undefined) {
      return this.currentRepositorySettingsService.getRepositorySettings();
    }
    return Promise.resolve(undefined);
  }

  async setRepositorySettings(repositorySettings: RepositorySettings) {
    if (this.currentRepositorySettingsService !== undefined) {
      this.currentRepositorySettingsService.setRepositorySettings(
        repositorySettings
      );
    }
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
    trash: boolean
  ): Promise<Array<Note> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getChildren(key, trash);
    }
    return Promise.resolve(undefined);
  }

  async getNote(key: string): Promise<Note | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getNote(key);
    }
    return Promise.resolve(undefined);
  }

  async getParents(key: string): Promise<Array<Note> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getParents(key, undefined);
    }
    return Promise.resolve(undefined);
  }

  async getBacklinks(key: string): Promise<Array<NoteDTO> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getBacklinks(key);
    }
    return Promise.resolve(undefined);
  }

  async getTags(key: string): Promise<Array<Tag> | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getTags(key);
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

  async findTag(tag: string): Promise<Tag[] | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.findTag(tag);
    }
    return Promise.resolve(undefined);
  }

  async addTag(key: string, tag: string): Promise<void | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addTag(key, tag);
    }
    return Promise.resolve(undefined);
  }

  async removeTag(key: string, tag: string): Promise<string[] | undefined> {
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
    from: string,
    to: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<void> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.moveNote(
        key,
        from,
        to,
        hitMode,
        relativeToKey
      );
    }
  }

  async moveNoteToTrash(key: string): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.moveNoteToTrash(key);
    }
    return Promise.resolve(undefined);
  }

  async restore(key: string): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.restore(key);
    }
    return Promise.resolve(undefined);
  }

  async deletePermanently(
    key: string,
    skipUpdatePosition?: boolean
  ): Promise<boolean | undefined> {
    if (this.currentRepository !== undefined) {
      await this.currentRepository.deletePermanently(key, skipUpdatePosition);
    }
    return Promise.resolve(undefined);
  }

  async getPriorityStat(): Promise<PriorityStatDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.getPriorityStat();
    }
    return Promise.resolve(undefined);
  }

  async addFile(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined> {
    if (this.currentRepository !== undefined) {
      return this.currentRepository.addFile(
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
}
