import fs from 'fs';
import path from 'path';
import { UserSettings } from '../types';
import UserSettingsPersister from '../main/modules/UserSettings/UserSettingsPersister';

async function removeNewCreatedUserSettingsFile() {
  try {
    await fs.promises.unlink(
      path.join('test-data/UserSettingsPersister/empty', 'userSettings.json')
    );
  } catch (exception) {
    /* ignore */
  }
}

afterAll(async () => {
  await removeNewCreatedUserSettingsFile();
});

test('UserSettingsPersister.getUserSettingsFilePath() undefined', async () => {
  const userSettingsPersister = new UserSettingsPersister([]);
  const currentUserSettingsFilePath =
    await userSettingsPersister.getCurrentUserSettingsFilePath();
  expect(currentUserSettingsFilePath).toBeUndefined();
});

test('UserSettingsPersister.getUserSettingsFilePath() only one existing empty folder', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/empty',
  ]);
  const currentUserSettingsFilePath = await userSettingsPersister.getCurrentUserSettingsFilePath();
  expect(currentUserSettingsFilePath).toMatch(/empty\\userSettings.json$/);
});

test('UserSettingsPersister.getUserSettingsFilePath() first folder contains user settings file', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/withGoodUserSettings',
    'test-data/UserSettingsPersister/empty',
  ]);
  const currentUserSettingsFilePath = await userSettingsPersister.getCurrentUserSettingsFilePath();
  expect(currentUserSettingsFilePath).toMatch(
    /withGoodUserSettings\\userSettings.json$/
  );
});

test('UserSettingsPersister.getUserSettingsFilePath() only folder does not exists', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'not_existing_folder',
  ]);
  const currentUserSettingsFilePath = await userSettingsPersister.getCurrentUserSettingsFilePath();
  expect(currentUserSettingsFilePath).toBeUndefined();
});

test('UserSettingsPersister.getUserSettingsFilePath() last folder does not exists', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/empty',
    'not_existing_folder',
  ]);
  const currentUserSettingsFilePath = await userSettingsPersister.getCurrentUserSettingsFilePath();
  expect(currentUserSettingsFilePath).toBeUndefined();
});

test('UserSettingsPersister.load() folder does not exists', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'not_existing_folder',
  ]);
  const userSettings: UserSettings | undefined = await userSettingsPersister.load();
  expect(userSettings).toBeUndefined();
});

test('UserSettingsPersister.load() folder exists without user settings file', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/empty',
  ]);
  const userSettings: UserSettings | undefined = await userSettingsPersister.load();
  expect(userSettings).toBeDefined();
  expect(userSettings?.repositories).toBeDefined();
  expect(userSettings?.repositories.length).toBe(0);
});

test('UserSettingsPersister.load() folder exists with user settings file', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/withGoodUserSettings',
  ]);
  const userSettings: UserSettings | undefined = await userSettingsPersister.load();
  expect(userSettings).toBeDefined();
  expect(userSettings?.repositories).toBeDefined();
  expect(userSettings?.repositories.length).toBe(1);
});

test('UserSettingsPersister.save() folder does not exists', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'not_existing_folder',
  ]);
  const userSettingsPath: string | undefined = await userSettingsPersister.save(
    {
      repositories: [],
    }
  );
  expect(userSettingsPath).toBeUndefined();
});

test('UserSettingsPersister.save() save and load', async () => {
  const userSettingsPersister = new UserSettingsPersister([
    'test-data/UserSettingsPersister/empty',
  ]);
  const userSettingsPath: string | undefined = await userSettingsPersister.save(
    {
      repositories: [
        {
          name: 'NOW NOte Repository',
          path: 'test_repo',
          type: 'sqlite3',
          default: false,
        },
      ],
    }
  );
  expect(userSettingsPath).toMatch(/empty\\userSettings.json$/);

  const userSettings = await userSettingsPersister.load();
  expect(userSettings).toBeDefined();
  expect(userSettings?.repositories).toBeDefined();
  expect(userSettings?.repositories.length).toBe(1);
});

/*

test('UserSettings created', () => {
  const userSettings = new UserSettings('SQLite Test repository', '', '');
  expect(userSettings).toBeNull();
});


*/
