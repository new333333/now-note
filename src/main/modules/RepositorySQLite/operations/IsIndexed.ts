import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import RepositorySQLite from '../RepositorySQLite';

export default async function isIndexed(
  repository: RepositorySQLite
): Promise<boolean> {
  const countResults: any = await repository
    .getSequelize()!
    .query(`SELECT count(*) FROM Notes_Index`, {
      raw: true,
      type: QueryTypes.SELECT,
    });

  log.debug(`RepositorySQLite.isIndexed() countResults=`, countResults);
  return countResults[0]['count(*)'] !== 0;
}
