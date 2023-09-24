import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NoteModel, RepositoryIntern } from '../../DataModels';

export default async function updateTrashFlag(
  repository: RepositoryIntern,
  keyPathParam: string,
  trash: boolean
): Promise<void> {
  const keyPath = `${keyPathParam.substring(0, keyPathParam.length - 1)}%`;

  await repository
    .getSequelize()!
    .query<NoteModel>(
      'UPDATE Notes set trash = :trash where keyPath LIKE :keyPath',
      {
        replacements: {
          trash,
          keyPath,
        },
        type: QueryTypes.SELECT, // ignore this error, this is the right type
      }
    );
}
