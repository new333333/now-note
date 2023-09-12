import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function findTag(
  repository: RepositorySQLite,
  tag: string
): Promise<string[]> {
  const results = await repository
    .getSequelize()
    .query(
      `SELECT distinct(tags) FROM Notes where tags is not null and tags != ''`,
      {
        raw: true,
        type: QueryTypes.SELECT,
      }
    );

  const tags: string[] = [];
  results.forEach((row) => {
    log.debug(`RepositorySQLite.findTag row=`, row);
    let noteTags: string = row['tags'];
    if (noteTags.length >= 4) {
      noteTags = noteTags.substring(2, noteTags.length - 2);
    }
    const noteTagsList = noteTags.split('|');
    noteTagsList.forEach(tag => {
      if (tags.indexOf(tag) === -1) {
        tags.push(tag);
     }
    });
  });

  return tags;
}
