import log from 'electron-log';
import { SettingsDTO } from 'types';
import { RepositoryIntern, SettingsModel } from '../../DataModels';

const getSettingsLog = log.scope('RepositorySQLite.getSettings');

export default async function getSettings(
  repository: RepositoryIntern
): Promise<SettingsDTO | undefined> {
  const settings = await SettingsModel.findOne();
  if (settings === null) {
    return undefined;
  }
  return settings.toDTO();
}
