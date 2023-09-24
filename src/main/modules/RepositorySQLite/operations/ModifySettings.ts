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
    defaults: {
      detailsNoteKey: settingsDTO.detailsNoteKey,
    },
  });
  if (!created) {
    settings.detailsNoteKey =
      settingsDTO.detailsNoteKey === undefined
        ? null
        : settingsDTO.detailsNoteKey;
  }

  settings.save();
  return settings.toDTO();
}
