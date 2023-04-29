import UserSettings from './user-settings';
import Repository from './Repository';

export default class NowNote {
  private isDirty: boolean = false;

  private userSettings: UserSettings;

  private currentRepository: Repository | null = null;

  constructor(userSettings: UserSettings) {
    this.userSettings = userSettings;
  }

  setDirty(dirty: boolean) {
    this.isDirty = dirty;
  }

  getUserSettings() {
    return this.userSettings;
  }

  setCurrentRepository(repository: Repository) {
    this.currentRepository = repository;
  }

  getCurrentRepository() {
    return this.currentRepository;
  }
}
