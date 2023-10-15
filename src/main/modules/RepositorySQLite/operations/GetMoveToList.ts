import log from 'electron-log';
import { MoveToDTO } from 'types';
import { MoveToModel, RepositoryIntern } from '../../DataModels';

export default async function getMoveToList(
  repository: RepositoryIntern,
): Promise<MoveToDTO[] | undefined> {
  const moveToModels = await MoveToModel.findAll({
    order: [['id', 'DESC']],
  });

  const moveToList: Array<MoveToDTO> = [];

  for (let i = 0; i < moveToModels.length; i += 1) {
    moveToList.push(moveToModels[i].toDTO());
  }

  return moveToList;
}
