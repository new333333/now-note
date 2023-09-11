import log from 'electron-log';
import { PriorityStatistics } from 'types';
import { QueryTypes } from 'sequelize';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function getPriorityStatistics(
  repository: RepositorySQLite
): Promise<PriorityStatistics> {
  const maximum: number = await Note.max('priority', {
    where: { trash: false },
  });
  const minimum: number = await Note.min('priority', {
    where: { trash: false },
  });

  let results = await repository
    .getSequelize()!
    .query(`SELECT AVG(priority) as average FROM notes`, {
      type: QueryTypes.SELECT,
    });
  const average: number = Math.round(results[0].average);

  results = await repository
    .getSequelize()!
    .query(
      `SELECT AVG(priority) as mediana FROM (SELECT priority FROM notes ORDER BY priority LIMIT 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM notes))`,
      { type: QueryTypes.SELECT }
    );

  const mediana: number = Math.round(results[0].mediana);

  log.debug(`RepositorySQLite.getPriorityStatistics() minimum=${minimum}`);

  return {
    minimum,
    average,
    mediana,
    maximum,
  };
}
