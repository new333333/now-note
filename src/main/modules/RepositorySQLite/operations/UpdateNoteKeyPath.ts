import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NotesIndexModel, RepositoryIntern } from '../../DataModels';

export default async function updateNoteKeyPath(
  repository: RepositoryIntern,
  oldKeyPathParam: string,
  newKeyPathParam: string
): Promise<void> {
  let oldKeyPath = oldKeyPathParam;
  let newKeyPath = newKeyPathParam;

  if (oldKeyPath.length > 0) {
    oldKeyPath = oldKeyPath.substring(0, oldKeyPath.length - 1);
  }
  if (newKeyPath.length > 0) {
    newKeyPath = newKeyPath.substring(0, newKeyPath.length - 1);
  }

  const likeOldKeyPath = `${oldKeyPath}%`;
  log.debug(`RepositorySQLite.updateNoteKeyPath() newKeyPath=${newKeyPath}`);
  log.debug(`RepositorySQLite.updateNoteKeyPath() oldKeyPath=${oldKeyPath}`);
  log.debug(
    `RepositorySQLite.updateNoteKeyPath() likeOldKeyPath=${likeOldKeyPath}`
  );

  if (oldKeyPath !== newKeyPath) {
    await repository
      .getSequelize()!
      .query<NotesIndexModel>(
        'UPDATE Notes set keyPath = REPLACE(keyPath, :oldKeyPath, :newKeyPath) where keyPath LIKE :likeOldKeyPath',
        {
          replacements: {
            oldKeyPath,
            newKeyPath,
            likeOldKeyPath,
          },
          type: QueryTypes.SELECT, // ignore this error, this is the right type
        }
      );
  }
}
