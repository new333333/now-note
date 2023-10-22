import log from 'electron-log';
import { OpenHistoryModel, RepositoryIntern } from '../../DataModels';

const addOpenHistoryLog = log.scope('RepositorySQLite.addOpenHistory');

export default async function addOpenHistory(
  repository: RepositoryIntern,
  key: string | null
): Promise<void | undefined> {
  addOpenHistoryLog.debug(`key=${key}`);
  const models = await OpenHistoryModel.findAll({
    where: {
      key,
    },
  });

  if (models.length === 0) {
    await OpenHistoryModel.create({
      key,
    });
  }
}
