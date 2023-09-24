import log from 'electron-log';
import { PriorityStatistics } from 'types';
import { QueryTypes } from 'sequelize';
import { NoteModel, RepositoryIntern } from '../../DataModels';

interface SearchResultAverage {
  average: number;
}

interface SearchResultMediana {
  mediana: number;
}

export default async function getPriorityStatistics(
  repository: RepositoryIntern
): Promise<PriorityStatistics> {
  const maximum: number = await NoteModel.max('priority', {
    where: { trash: false },
  });
  const minimum: number = await NoteModel.min('priority', {
    where: { trash: false },
  });

  const resultsAverage = await repository
    .getSequelize()!
    .query<SearchResultAverage>(`SELECT AVG(priority) as average FROM notes`, {
      type: QueryTypes.SELECT,
    });
  const average: number = Math.round(resultsAverage[0].average);

  const resultsMediana = await repository
    .getSequelize()!
    .query<SearchResultMediana>(
      `SELECT AVG(priority) as mediana FROM (SELECT priority FROM notes ORDER BY priority LIMIT 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM notes))`,
      { type: QueryTypes.SELECT }
    );

  const mediana: number = Math.round(resultsMediana[0].mediana);

  log.debug(`RepositorySQLite.getPriorityStatistics() minimum=${minimum}`);

  return {
    minimum,
    average,
    mediana,
    maximum,
  };
}
