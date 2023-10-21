import log from 'electron-log';
import { NoteDTO } from 'types';
import { FindOptions } from 'sequelize';
import { NoteModel, RepositoryIntern } from '../../DataModels';

const getPreviousLog = log.scope('RepositorySQLite.getPrevious');

export default async function getPrevious(
  repository: RepositoryIntern,
  key: string
): Promise<NoteDTO | null> {
  getPreviousLog.debug(`RepositorySQLite.getPrevious() key=${key}`);

  const note: NoteModel | null = await NoteModel.findByPk(key);
  if (note === null) {
    return null;
  }

  if (note.position === 0) {
    return null;
  }

  const findOneParams: FindOptions<NoteModel> = {
    where: {
      parent: note.parent,
      position: note.position - 1,
    },
  };

  getPreviousLog.debug(`findAllParams=`, findOneParams);
  const previousNote = await NoteModel.findOne(findOneParams);
  if (previousNote === null) {
    return null;
  }
  return previousNote.dataValues;
}
