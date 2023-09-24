import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { RepositoryIntern } from 'main/modules/DataModels';

interface SearchResult {
  countNotesIndex: number;
}

export default async function isIndexed(
  repository: RepositoryIntern
): Promise<boolean> {
  const countResults = await repository
    .getSequelize()!
    .query<SearchResult>(
      `SELECT count(*) as countNotesIndex FROM Notes_Index`,
      {
        raw: true,
        type: QueryTypes.SELECT,
      });

  log.debug(`RepositorySQLite.isIndexed() countResults=`, countResults);
  return countResults[0].countNotesIndex !== 0;
}
