import log from 'electron-log';
import { NoteDTO } from 'types';
import { NoteModel, RepositoryIntern } from '../../DataModels';
import prepareDescriptionToRead from './PrepareDescriptionToRead';

const getNoteWithDescriptionLog = log.scope(
  'RepositorySQLite.getNoteWithDescription'
);

export default async function getNoteWithDescription(
  repository: RepositoryIntern,
  key: string,
  withoutDescription?: boolean
): Promise<NoteDTO | undefined> {
  getNoteWithDescriptionLog.debug(`key=${key}`);

  if (key === undefined) {
    return undefined;
  }

  const noteModel = await NoteModel.findByPk(key);
  if (noteModel === null) {
    return undefined;
  }
  getNoteWithDescriptionLog.debug(`has NoteModel.findByPk`);

  if (withoutDescription) {
    noteModel.description = await prepareDescriptionToRead(
      repository,
      noteModel.description || ''
    );
    getNoteWithDescriptionLog.debug(`has prepareDescriptionToRead`);
  }
  return noteModel.toDTO();
}
