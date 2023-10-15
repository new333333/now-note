import log from 'electron-log';
import { MoveToModel, RepositoryIntern } from '../../DataModels';

export default async function removeMoveTo(
  repository: RepositoryIntern,
  id: number
): Promise<void | undefined> {
  const moveToModel: MoveToModel | null = await MoveToModel.findByPk(id);
  if (moveToModel !== null) {
    moveToModel.destroy();
  }
}
