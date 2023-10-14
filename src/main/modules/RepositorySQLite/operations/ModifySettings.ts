import log from 'electron-log';
import { SettingsDTO } from 'types';
import { RepositoryIntern, SettingsModel } from '../../DataModels';

const modifySettingsLog = log.scope('RepositorySQLite.modifySettings');

export default async function modifySettings(
  repository: RepositoryIntern,
  settingsDTO: SettingsDTO
): Promise<SettingsDTO | undefined> {
  modifySettingsLog.debug(`settingsDTO=${settingsDTO}`);
  const [settings, created] = await SettingsModel.findOrCreate({
    where: {},
    defaults: settingsDTO,
  });
  if (!created) {
    if (settingsDTO.detailsNoteKey !== undefined) {
      settings.detailsNoteKey = settingsDTO.detailsNoteKey;
    }
  }

  settings.save();
  return settings.toDTO();
}
