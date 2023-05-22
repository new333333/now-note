import log from 'electron-log';
import path from 'path';
import UserSettingsPersister from './UserSettingsPersister';
import { UserSettings, UserSettingsRepository } from '../../../types';

export default class UserSettingsService {
  private userSettingsPersister: UserSettingsPersister;

  private settings: UserSettings | undefined;

  constructor(userSettingsPersister: UserSettingsPersister) {
    this.userSettingsPersister = userSettingsPersister;
  }

  async getRepositories(): Promise<Array<UserSettingsRepository> | undefined> {
    if (this.settings === undefined) {
      this.settings = await this.userSettingsPersister.load();
    }
    if (this.settings === undefined) {
      return undefined;
    }
    return this.settings!.repositories;
  }

  async getDefaultRepository(): Promise<UserSettingsRepository | undefined> {
    if (this.settings === undefined) {
      this.settings = await this.userSettingsPersister.load();
    }
    if (this.settings === undefined) {
      return undefined;
    }

    let defaultRepository = this.settings!.repositories.find((repository) => {
      return repository.default;
    });

    if (
      defaultRepository === undefined &&
      this.settings!.repositories.length > 0
    ) {
      // eslint-disable-next-line prefer-destructuring
      defaultRepository = this.settings!.repositories[0];
    }

    return defaultRepository;
  }

  async setDefaultRepository(
    repositoryFolder: string
  ): Promise<UserSettingsRepository | undefined> {
    const newDefaultRepository: UserSettingsRepository | undefined =
      await this.geRepositoryByPath(repositoryFolder);

    if (newDefaultRepository === undefined) {
      return undefined;
    }

    if (newDefaultRepository.default) {
      return newDefaultRepository;
    }

    this.settings!.repositories.forEach((repository) => {
      if (
        path.normalize(repository.path) === path.normalize(repositoryFolder)
      ) {
        repository.default = true;
      } else {
        repository.default = false;
      }
    });
    await this.userSettingsPersister.save(this.settings!);

    return newDefaultRepository;
  }

  async geRepositoryByPath(
    repositoryFolder: string
  ): Promise<UserSettingsRepository | undefined> {
    if (this.settings === undefined) {
      this.settings = await this.userSettingsPersister.load();
    }
    if (this.settings === undefined) {
      return undefined;
    }
    const foundRepository = this.settings!.repositories.find((repository) => {
      return (
        path.normalize(repository.path) === path.normalize(repositoryFolder)
      );
    });
    return Promise.resolve(foundRepository);
  }

  async addRepository(
    name: string,
    repositoryFolder: string,
    type: string
  ): Promise<UserSettingsRepository | undefined> {
    const repositoryByPath: UserSettingsRepository | undefined =
      await this.geRepositoryByPath(repositoryFolder);

    if (this.settings === undefined) {
      return undefined;
    }

    if (repositoryByPath === undefined) {
      const newRepository: UserSettingsRepository = {
        name,
        path: repositoryFolder,
        type,
        default: this.settings!.repositories.length === 0,
      };
      this.settings!.repositories.push(newRepository);
      await this.userSettingsPersister.save(this.settings!);
      return newRepository;
    }

    return repositoryByPath;
  }
}
