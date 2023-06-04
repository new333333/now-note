import fs from 'fs';
import { RepositorySettings } from 'types';
import RepositorySettingsService from '../../main/modules/RepositorySettings/RepositorySettingsService';
/*
jest.mock('fs', () => ({
  promises: {
    writeFile: jest
      .fn((filePath, encoding) => new Promise())
      .mockResolvedValue(),
    readFile: jest
      .fn()
      .mockImplementation((settingsFilePath, encoding) =>
        Promise.resolve(value)
      ),
  },
}));
*/
test('RepositorySettingsService.getDirectory()', async () => {
  const repositorySettingsService = new RepositorySettingsService(
    'test_folder'
  );
  expect(repositorySettingsService.getDirectory()).toBe('test_folder');
});
/*
test('RepositorySettingsService.set and get', async () => {
  const repositorySettingsService = new RepositorySettingsService(
    'test_folder'
  );
  const repositorySettings: RepositorySettings = {
    filter: {
      onlyNotes: false,
      onlyTasks: false,
      onlyDone: false,
      onlyNotDone: false,
    },
    state: {
      details: {
        key: undefined,
      },
      list: {
        key: undefined,
      },
    },
  };
  await repositorySettingsService.setRepositorySettings(repositorySettings);
  const savedepositorySettings =
    await repositorySettingsService.getRepositorySettings();
  expect(savedepositorySettings.filter.onlyDone).toBe('test_folder');

  expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
  expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
});
*/
