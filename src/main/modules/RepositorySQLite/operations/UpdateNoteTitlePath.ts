import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NotesIndex } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function updateNoteTitlePath(
  repository: RepositorySQLite,
  oldTitlePathParam: string,
  newTitlePathParam: string,
  keyPathParam: string
) {
  let oldTitlePath = oldTitlePathParam;
  let newTitlePath = newTitlePathParam;
  let keyPath = keyPathParam;

  if (oldTitlePath.length > 0) {
    oldTitlePath = oldTitlePath.substring(
      0,
      oldTitlePath.length - 1
    );
  }
  if (newTitlePath.length > 0) {
    newTitlePath = newTitlePath.substring(
      0,
      newTitlePath.length - 1
    );
  }
  if (keyPath.length > 0) {
    keyPath = `${keyPath.substring(
      0,
      keyPath.length - 1
    )}%`;
  }

  log.debug(
    `RepositorySQLite.modifyNote() oldTitlePath=${oldTitlePath}`
  );
  log.debug(
    `RepositorySQLite.modifyNote() newTitlePath=${newTitlePath}`
  );
  log.debug(`RepositorySQLite.modifyNote() keyPath=${keyPath}`);

  if (oldTitlePath !== newTitlePath) {
    await repository
      .getSequelize()!
      .query<NotesIndex>(
        'UPDATE Notes set titlePath = REPLACE(titlePath, :oldTitlePath, :newTitlePath) where keyPath LIKE :keyPath',
        {
          replacements: {
            oldTitlePath,
            newTitlePath,
            keyPath,
          },
          type: QueryTypes.SELECT, // ignore this error, this is the right type
        }
      );
  }
}
