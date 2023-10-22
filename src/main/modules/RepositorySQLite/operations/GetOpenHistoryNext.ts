import log from 'electron-log';
import { OpenHistoryDTO } from 'types';
import { OpenHistoryModel, RepositoryIntern } from '../../DataModels';

export default async function getOpenHistoryNext(
  repository: RepositoryIntern,
  id: number | undefined
): Promise<OpenHistoryDTO | undefined> {
  if (id === null || id === undefined) {
    return undefined;
  }
  const model = await OpenHistoryModel.findOne({
    where: {
      id: id + 1,
    },
  });

  if (model === null) {
    return undefined;
  }

  return model.toDTO();
}
