import fs from 'fs';
import path from 'path';
import { UserSettings } from '../../../types';

export default class UserSettingsPersister {
  private pathsToInspect: Array<string>;

  private currentUserSettingsFilePath: string | undefined;

  private settingsFileName: string = 'userSettings.json';

  constructor(pathsToInspect: Array<string>) {
    this.pathsToInspect = pathsToInspect;
  }

  async getCurrentUserSettingsFilePath(): Promise<string | undefined> {
    if (this.currentUserSettingsFilePath) {
      return this.currentUserSettingsFilePath;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const pathToInspect of this.pathsToInspect) {
      try {
        const userSettingsFilePath = path.join(
          pathToInspect,
          this.settingsFileName
        );
        // eslint-disable-next-line no-await-in-loop
        const stats = await fs.promises.stat(userSettingsFilePath);
        if (stats.isFile()) {
          this.currentUserSettingsFilePath = userSettingsFilePath;
          break;
        }
      } catch (exception) {
        // ignore, file doesn't exists
      }
    }

    if (
      this.currentUserSettingsFilePath === undefined &&
      this.pathsToInspect.length > 0
    ) {
      const pathToInspect = this.pathsToInspect[this.pathsToInspect.length - 1];
      try {
        const stats = await fs.promises.stat(pathToInspect);
        if (stats.isDirectory()) {
          const userSettingsFilePath = path.join(
            pathToInspect,
            this.settingsFileName
          );
          this.currentUserSettingsFilePath = userSettingsFilePath;
        }
      } catch (exception) {
        // ignore, folder doesn't exists
      }
    }
    return this.currentUserSettingsFilePath;
  }

  async load(): Promise<UserSettings | undefined> {
    const userSettingsFilePath: string | undefined = await this.getCurrentUserSettingsFilePath();
    if (userSettingsFilePath !== undefined) {
      try {
        const settingsJSON: string = await fs.promises.readFile(
          userSettingsFilePath,
          'utf-8'
        );
        return JSON.parse(settingsJSON);
      } catch (error) {
        return {
          repositories: [],
        };
      }
    }
    return undefined;
  }

  async save(userSettings: UserSettings): Promise<string | undefined> {
    const userSettingsFilePath: string | undefined =
      await this.getCurrentUserSettingsFilePath();
    if (userSettingsFilePath !== undefined) {
      await fs.promises.writeFile(
        userSettingsFilePath,
        JSON.stringify(userSettings, null, 2)
      );
      return userSettingsFilePath;
    }
    return undefined;
  }
}
