import log from 'electron-log';
import { NoteDTO } from 'types';
import {
  Description,
  Note,
  NoteNotFoundByKeyError,
  Title,
} from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import prepareDescriptionToRead from './PrepareDescriptionToRead';

export default async function getNoteWithDescription(
  repository: RepositorySQLite,
  key: string
): Promise<Note | undefined> {
  if (key === undefined) {
    return undefined;
  }

  const noteModel = await Note.findByPk(key);
  if (noteModel === null) {
    return undefined;
  }
  noteModel.description = await prepareDescriptionToRead(
    repository,
    noteModel.description || ''
  );
  return noteModel.dataValues;
}

