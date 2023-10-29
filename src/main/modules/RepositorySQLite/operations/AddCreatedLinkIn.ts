import log from 'electron-log';
import { CreatedLinkInModel, RepositoryIntern } from '../../DataModels';

const addCreatedLinkInLog = log.scope('RepositorySQLite.addCreatedLinkIn');

export default async function addCreatedLinkIn(
  repository: RepositoryIntern,
  key: string | null
): Promise<void | undefined> {
  addCreatedLinkInLog.debug(`key=${key}`);
  if (key === undefined || key === null) {
    return;
  }
  const createdLinkInModels = await CreatedLinkInModel.findAll({
    where: {
      key,
    },
  });

  if (createdLinkInModels.length === 0) {
    await CreatedLinkInModel.create({
      key,
    });
  }
}
