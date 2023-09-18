import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import prepareDescriptionToRead from './PrepareDescriptionToRead';

const getNoteWithDescriptionLog = log.scope(
  'RepositorySQLite.getNoteWithDescription'
);

export default async function getNoteWithDescription(
  repository: RepositorySQLite,
  key: string
): Promise<Note | undefined> {
  getNoteWithDescriptionLog.debug(`key=${key}`);

  if (key === undefined) {
    return undefined;
  }

  const noteModel = await Note.findByPk(key);
  if (noteModel === null) {
    return undefined;
  }
  getNoteWithDescriptionLog.debug(`has Note.findByPk`);

  noteModel.description = await prepareDescriptionToRead(
    repository,
    noteModel.description || ''
  );
  getNoteWithDescriptionLog.debug(`has prepareDescriptionToRead`);

  return noteModel.get({ plain: true });
}
