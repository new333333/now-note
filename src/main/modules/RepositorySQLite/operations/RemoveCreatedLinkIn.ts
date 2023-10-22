import log from 'electron-log';
import { CreatedLinkInModel, RepositoryIntern } from '../../DataModels';

export default async function removeCreatedLinkIn(
  repository: RepositoryIntern,
  id: number
): Promise<void | undefined> {
  const createdLinkInModel: CreatedLinkInModel | null =
    await CreatedLinkInModel.findByPk(id);
  if (createdLinkInModel !== null) {
    createdLinkInModel.destroy();
  }
}
