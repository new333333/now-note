import fs from 'fs';
import path from 'path';

export interface RepositorySettings {
  filter: {
    onlyNotes: boolean;
    onlyTasks: boolean;
    onlyDone: boolean;
    onlyNotDone: boolean;
  };

  state: {
    details: {
      key: string | undefined;
    };
    list: {
      key: string | undefined;
    };
  };

  // v1, don't need any more
  filterOnlyNotes?: boolean;
  filterOnlyTasks?: boolean;
  filterOnlyDone?: boolean;
  filterOnlyNotDone?: boolean;
}

export default class RepositorySettingsService {
  private directory: string;

  private SETTINGS_FILE_NAME: string = 'now-note-repository-settings.json';

  constructor(directory: string) {
    this.directory = directory;
  }

  getDirectory(): string {
    return this.directory;
  }

  async setRepositorySettings(repositorySettings: RepositorySettings) {
    let settings = await this.getRepositorySettings();

    settings = { ...settings, ...repositorySettings };

    delete settings.filterOnlyNotes;
    delete settings.filterOnlyTasks;
    delete settings.filterOnlyDone;
    delete settings.filterOnlyNotDone;

    const settingsFilePath = path.join(this.directory, this.SETTINGS_FILE_NAME);
    await fs.promises.writeFile(
      settingsFilePath,
      JSON.stringify(settings, null, 2)
    );
  }

  async getRepositorySettings(): Promise<RepositorySettings> {
    let settings: RepositorySettings = {
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
    const settingsFilePath = path.join(this.directory, this.SETTINGS_FILE_NAME);
    try {
      const settingsText = await fs.promises.readFile(
        settingsFilePath,
        'utf-8'
      );
      settings = JSON.parse(settingsText);
    } catch (error) {
      // log.warn("Cannot load repository settings from " + settingsFilePath);
    }
    return settings;
  }
}
