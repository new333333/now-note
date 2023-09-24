import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NotesIndexModel, RepositoryIntern } from '../../DataModels';

export default async function updateNoteTitlePath(
  repository: RepositoryIntern,
  oldTitlePathParam: string,
  newTitlePathParam: string,
  keyPathParam: string
) {
  let oldTitlePath = oldTitlePathParam;
  let newTitlePath = newTitlePathParam;
  let keyPath = keyPathParam;

  if (oldTitlePath.length > 0) {
    oldTitlePath = oldTitlePath.substring(0, oldTitlePath.length - 1);
  }
  if (newTitlePath.length > 0) {
    newTitlePath = newTitlePath.substring(0, newTitlePath.length - 1);
  }
  if (keyPath.length > 0) {
    keyPath = `${keyPath.substring(0, keyPath.length - 1)}%`;
  }

  log.debug(
    `RepositorySQLite.updateNoteTitlePath() oldTitlePath=${oldTitlePath}`
  );
  log.debug(
    `RepositorySQLite.updateNoteTitlePath() newTitlePath=${newTitlePath}`
  );
  log.debug(`RepositorySQLite.updateNoteTitlePath() keyPath=${keyPath}`);

  if (oldTitlePath !== newTitlePath) {
    await repository
      .getSequelize()!
      .query<NotesIndexModel>(
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
