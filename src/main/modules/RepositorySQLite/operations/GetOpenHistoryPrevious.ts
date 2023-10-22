import log from 'electron-log';
import { OpenHistoryDTO } from 'types';
import { OpenHistoryModel, RepositoryIntern } from '../../DataModels';

export default async function getOpenHistoryPrevious(
  repository: RepositoryIntern,
  id: number | undefined
): Promise<OpenHistoryDTO | undefined> {
  let max: number = await OpenHistoryModel.max('id');

  if (max !== undefined && max !== null) {
    max -= 1;
  } else {
    max = -1;
  }

  const model = await OpenHistoryModel.findOne({
    where: {
      id: id !== undefined && id !== null ? id - 1 : max,
    },
  });

  if (model === null) {
    return undefined;
  }

  return model.toDTO();
}
