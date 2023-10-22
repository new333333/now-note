import log from 'electron-log';
import { CreatedLinkInDTO } from 'types';
import { CreatedLinkInModel, RepositoryIntern } from '../../DataModels';

export default async function getCreatedLinkInList(
  repository: RepositoryIntern,
): Promise<CreatedLinkInDTO[] | undefined> {
  const createdLinkInModels = await CreatedLinkInModel.findAll({
    order: [['id', 'DESC']],
  });

  const createdLinkInList: Array<CreatedLinkInDTO> = [];

  for (let i = 0; i < createdLinkInModels.length; i += 1) {
    createdLinkInList.push(createdLinkInModels[i].toDTO());
  }

  return createdLinkInList;
}
