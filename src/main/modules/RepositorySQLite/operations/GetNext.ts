import log from 'electron-log';
import { NoteDTO } from 'types';
import { FindOptions } from 'sequelize';
import { NoteModel, RepositoryIntern } from '../../DataModels';

const getNextLog = log.scope('RepositorySQLite.getNext');

export default async function getNext(
  repository: RepositoryIntern,
  key: string
): Promise<NoteDTO | null> {
  getNextLog.debug(`RepositorySQLite.getNext() key=${key}`);

  const note: NoteModel | null = await NoteModel.findByPk(key);
  if (note === null) {
    return null;
  }

  const findOneParams: FindOptions<NoteModel> = {
    where: {
      parent: note.parent,
      position: note.position + 1,
    },
  };

  getNextLog.debug(`findAllParams=`, findOneParams);
  const nextNote = await NoteModel.findOne(findOneParams);
  if (nextNote === null) {
    return null;
  }
  return nextNote.dataValues;
}
