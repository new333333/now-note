import log from 'electron-log';
import { OpenHistoryModel, RepositoryIntern } from '../../DataModels';

export default async function removeOpenHistory(
  repository: RepositoryIntern,
  id: number
): Promise<void | undefined> {
  const model: OpenHistoryModel | null = await OpenHistoryModel.findByPk(id);
  if (model !== null) {
    model.destroy();
  }
}
