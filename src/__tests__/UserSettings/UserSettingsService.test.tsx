import { UserSettingsRepository } from '../../types';
import UserSettingsService from '../../main/modules/UserSettings/UserSettingsService';

jest.mock('../../main/modules/UserSettings/UserSettingsPersister');

test('UserSettingsManger get existing repositories', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const repositories: Array<UserSettingsRepository> | undefined =
    await userSettingsManger.getRepositories();
  expect(repositories).toBeDefined();
  expect(repositories?.length).toBe(1);
});

test('UserSettingsManger get no repositories', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve(undefined);
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const repositories: Array<UserSettingsRepository> | undefined =
    await userSettingsManger.getRepositories();
  expect(repositories).toBeUndefined();
});

test('UserSettingsManger get empty repositories list', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const repositories: Array<UserSettingsRepository> | undefined =
    await userSettingsManger.getRepositories();
  expect(repositories).toBeDefined();
  expect(repositories?.length).toBe(0);
});

test('UserSettingsManger getDefaultRepository() no repos', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve(undefined);
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.getDefaultRepository();
  expect(defaultRepository).toBeUndefined();
});

test('UserSettingsManger getDefaultRepository() the only one', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.getDefaultRepository();
  expect(defaultRepository).toBeDefined();
});

test('UserSettingsManger getDefaultRepository() select 2. from 2 of them', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
        {
          name: 'DefaultRepository',
          path: 'this_will_be_ignored_2',
          repositoryType: 'sqlite3',
          default: true,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.getDefaultRepository();
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.name).toBe('DefaultRepository');
});

test('UserSettingsManger getDefaultRepository() select 1. from 2 of them', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'this_will_be_ignored_2',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.getDefaultRepository();
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.name).toBe('DefaultRepository');
});

test('UserSettingsManger geRepositoryByPath() none', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve(undefined);
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.geRepositoryByPath('not_existing');
  expect(defaultRepository).toBeUndefined();
});


test('UserSettingsManger geRepositoryByPath() found', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'should_find_this',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.geRepositoryByPath('should_find_this');
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.name).toBe('DefaultRepository');
});

test('UserSettingsManger geRepositoryByPath() found by relative path', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'should_find_this',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.geRepositoryByPath('./should_find_this');
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.name).toBe('DefaultRepository');
});

test('UserSettingsManger addRepository() first one on not existing folder', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve(undefined);
  });
  jest.spyOn(UserSettingsPersister.prototype, 'save');

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['will_be_ignored'])
  );
  const newRepository: UserSettingsRepository | undefined =
    await userSettingsManger.addRepository(
      'DefaultRepository',
      'should_find_this',
      'sqlite3'
    );
  expect(newRepository).toBeUndefined();
});

test('UserSettingsManger addRepository() first one on existing folder', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [],
    });
  });
  const saveMethodMock = jest.spyOn(UserSettingsPersister.prototype, 'save');

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['will_be_ignored'])
  );
  const newRepository: UserSettingsRepository | undefined =
    await userSettingsManger.addRepository(
      'DefaultRepository',
      'should_find_this',
      'sqlite3'
    );
  expect(newRepository).toBeDefined();
  expect(newRepository!.name).toBe('DefaultRepository');
  expect(saveMethodMock).toHaveBeenCalledWith({
    repositories: [
      {
        name: 'DefaultRepository',
        path: 'should_find_this',
        repositoryType: 'sqlite3',
        default: true,
      },
    ],
  });
});

test('UserSettingsManger addRepository() second one on existing folder', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_ignored',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });
  const saveMethodMock = jest.spyOn(UserSettingsPersister.prototype, 'save');

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['will_be_ignored'])
  );
  const newRepository: UserSettingsRepository | undefined =
    await userSettingsManger.addRepository(
      'DefaultRepository',
      'should_find_this',
      'sqlite3'
    );
  expect(newRepository).toBeDefined();
  expect(newRepository!.name).toBe('DefaultRepository');
  expect(saveMethodMock).toHaveBeenCalledWith({
    repositories: [
      {
        name: 'NOW NOte Repository',
        path: 'this_will_be_ignored',
        repositoryType: 'sqlite3',
        default: false,
      },
      {
        name: 'DefaultRepository',
        path: 'should_find_this',
        repositoryType: 'sqlite3',
        default: false,
      },
    ],
  });
});

test('UserSettingsManger setDefaultRepository() was 1. set 2.', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'this_is_default_repository',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_default_repository',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });
  const saveMethodMock = jest
    .spyOn(UserSettingsPersister.prototype, 'save')
    .mockClear();
  expect(saveMethodMock).toHaveBeenCalledTimes(0);

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.setDefaultRepository(
      'this_will_be_default_repository'
    );
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.default).toBe(true);
  expect(saveMethodMock).toHaveBeenCalledWith({
    repositories: [
      {
        name: 'DefaultRepository',
        path: 'this_is_default_repository',
        repositoryType: 'sqlite3',
        default: false,
      },
      {
        name: 'NOW NOte Repository',
        path: 'this_will_be_default_repository',
        repositoryType: 'sqlite3',
        default: true,
      },
    ],
  });
});


test('UserSettingsManger setDefaultRepository() repository does not exists', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'this_is_default_repository',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_default_repository',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });
  const saveMethodMock = jest
    .spyOn(UserSettingsPersister.prototype, 'save')
    .mockClear();
  expect(saveMethodMock).toHaveBeenCalledTimes(0);

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const newDefaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.setDefaultRepository('this_path_does not exists');
  expect(newDefaultRepository).toBeUndefined();
  expect(saveMethodMock).toHaveBeenCalledTimes(0);
});


test('UserSettingsManger setDefaultRepository() set the same', async () => {
  jest.spyOn(UserSettingsPersister.prototype, 'load').mockImplementation(() => {
    return Promise.resolve({
      repositories: [
        {
          name: 'DefaultRepository',
          path: 'this_is_default_repository',
          repositoryType: 'sqlite3',
          default: true,
        },
        {
          name: 'NOW NOte Repository',
          path: 'this_will_be_default_repository',
          repositoryType: 'sqlite3',
          default: false,
        },
      ],
    });
  });
  const saveMethodMock = jest
    .spyOn(UserSettingsPersister.prototype, 'save')
    .mockClear();
  expect(saveMethodMock).toHaveBeenCalledTimes(0);

  const userSettingsManger = new UserSettingsService(
    new UserSettingsPersister(['this_will_be_ignored'])
  );
  const defaultRepository: UserSettingsRepository | undefined =
    await userSettingsManger.setDefaultRepository('this_is_default_repository');
  expect(defaultRepository).toBeDefined();
  expect(defaultRepository!.default).toBe(true);
  expect(saveMethodMock).toHaveBeenCalledTimes(0);
});
