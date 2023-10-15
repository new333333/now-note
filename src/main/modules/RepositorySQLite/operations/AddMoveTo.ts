import log from 'electron-log';
import { MoveToModel, RepositoryIntern } from '../../DataModels';

const addMoveToLog = log.scope('RepositorySQLite.addMoveTo');

export default async function addMoveTo(
  repository: RepositoryIntern,
  key: string | null
): Promise<void | undefined> {
  addMoveToLog.debug(`key=${key}`);
  const moveToModels = await MoveToModel.findAll({
    where: {
      key: key,
    },
  });

  if (moveToModels.length === 0) {
    await MoveToModel.create({
      key,
    });
  }
}
