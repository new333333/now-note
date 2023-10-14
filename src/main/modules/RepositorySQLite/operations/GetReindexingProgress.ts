import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { RepositoryIntern } from '../../DataModels';

interface SearchResultCount {
  q: number;
}

export default async function getReindexingProgress(
  repository: RepositoryIntern
): Promise<number> {
  log.debug(`RepositorySQLite.getReindexingProgress()`);
  const countNotesIndexResult = await repository
    .getSequelize()!
    .query<SearchResultCount>(`SELECT count(*) as q FROM Notes_Index`, {
      raw: true,
      type: QueryTypes.SELECT,
    });

  const countNotesResult = await repository
    .getSequelize()!
    .query<SearchResultCount>(`SELECT count(*) as q FROM Notes`, {
      raw: true,
      type: QueryTypes.SELECT,
    });

  const countNotesIndex: number = countNotesIndexResult[0].q;
  const countNotes: number = countNotesResult[0].q;

  log.debug(
    `RepositorySQLite.getReindexingProgress() countNotesIndex=, countNotes=`,
    countNotesIndex,
    countNotes
  );

  const progress =
    countNotes > 0 ? Math.floor((countNotesIndex / countNotes) * 100) : 100;

  log.debug(`RepositorySQLite.getReindexingProgress() progress=`, progress);

  return progress;
}
