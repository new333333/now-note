import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NotesIndex } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function updateNoteKeyPath(
  repository: RepositorySQLite,
  oldKeyPathParam: string,
  newKeyPathParam: string
) {
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
      .query<NotesIndex>(
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
