import log from 'electron-log';
import { NoteDTO } from 'types';
import { FindOptions } from 'sequelize';
import { NoteModel, RepositoryIntern } from '../../DataModels';

const getChildrenLog = log.scope('RepositorySQLite.getChildren');

// load root nodes, if key undefined
// load children notes if key defined
export default async function getChildren(
  repository: RepositoryIntern,
  key: string | null | undefined,
  trash?: boolean,
  limit?: number
): Promise<Array<NoteDTO>> {
  getChildrenLog.debug(
    `RepositorySQLite.getChildren() key=${key}, trash=${trash} limit=${limit}`
  );

  const findAllParams: FindOptions<NoteModel> = {
    where: {
      parent: key === undefined ? null : key,
    },
    order: [['position', 'ASC']],
  };

  if (
    findAllParams.where !== undefined &&
    (key === undefined || key === null)
  ) {
    findAllParams.where.trash = trash;
  }

  if (limit !== undefined) {
    findAllParams.limit = limit;
  }
  getChildrenLog.debug(`findAllParams=`, findAllParams);
  const notes = await NoteModel.findAll(findAllParams);

  const resultNotes: Array<NoteDTO> = [];
  for (let i = 0; i < notes.length; i += 1) {
    const noteModel = notes[i];
    resultNotes.push(noteModel.toDTO());
  }
  return resultNotes;
}
