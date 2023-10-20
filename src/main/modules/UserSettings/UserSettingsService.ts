import log from 'electron-log';
import path from 'path';
import Store, { Schema } from 'electron-store';
import { UserSettings, UserSettingsRepository } from '../../../types';

export default class UserSettingsService {
  private store: Store<UserSettings> | undefined;

  constructor() {
    const schema: Schema<UserSettings> = {
      repositories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            repositoryType: { type: 'string' },
            default: { type: 'boolean' },
          },
          required: ['path', 'default', 'repositoryType', 'name'],
        },
      },
    };

    this.store = new Store<UserSettings>({ schema });
  }

  async getRepositories(): Promise<Array<UserSettingsRepository> | undefined> {
    const repositories: UserSettingsRepository[] | undefined =
      this.store?.get('repositories');

    return repositories;
  }

  async getDefaultRepository(): Promise<UserSettingsRepository | undefined> {
    let repositories: UserSettingsRepository[] | undefined =
      this.store?.get('repositories');

    if (repositories === undefined) {
      repositories = [];
    }

    let defaultRepository = repositories.find((repository) => {
      return repository.default;
    });

    if (defaultRepository === undefined && repositories.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      defaultRepository = repositories[0];
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

    let repositories: UserSettingsRepository[] | undefined =
      this.store?.get('repositories');

    if (repositories === undefined) {
      repositories = [];
    }

    repositories.forEach((repository) => {
      if (
        path.normalize(repository.path) === path.normalize(repositoryFolder)
      ) {
        repository.default = true;
      } else {
        repository.default = false;
      }
    });

    this.store?.set('repositories', repositories);
    return newDefaultRepository;
  }

  async geRepositoryByPath(
    repositoryFolder: string
  ): Promise<UserSettingsRepository | undefined> {
    let repositories: UserSettingsRepository[] | undefined =
      this.store?.get('repositories');

    if (repositories === undefined) {
      repositories = [];
    }
    const foundRepository = repositories.find((repository) => {
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

    let repositories: UserSettingsRepository[] | undefined =
      this.store?.get('repositories');

    if (repositories === undefined) {
      repositories = [];
    }

    if (repositoryByPath === undefined) {
      const newRepository: UserSettingsRepository = {
        name,
        path: repositoryFolder,
        repositoryType: type,
        default: repositories.length === 0,
      };
      repositories.push(newRepository);
      this.store?.set('repositories', repositories);
      return newRepository;
    }

    return repositoryByPath;
  }
}
