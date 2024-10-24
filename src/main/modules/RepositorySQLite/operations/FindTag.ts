import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { RepositoryIntern } from 'main/modules/DataModels';

interface SelectResult {
  tags: string;
}

export default async function findTag(
  repository: RepositoryIntern,
  tag: string
): Promise<string[]> {
  const results = await repository
    .getSequelize()
    .query<SelectResult>(
      `SELECT distinct(tags) FROM Notes where tags is not null and tags != ''`,
      {
        raw: true,
        type: QueryTypes.SELECT,
      }
    );

  const tags: string[] = [];
  results.forEach((row: SelectResult) => {
    log.debug(`RepositorySQLite.findTag row=`, row);
    let noteTags: string = row.tags;
    if (noteTags.length >= 4) {
      noteTags = noteTags.substring(2, noteTags.length - 2);
    }
    const noteTagsList = noteTags.split('|');
    noteTagsList.forEach((nextTag) => {
      const nextTagTrimmed = nextTag.trim();
      if (
        nextTagTrimmed.toLowerCase().startsWith(tag.toLowerCase()) &&
        tags.indexOf(nextTagTrimmed) === -1
      ) {
        tags.push(nextTagTrimmed);
      }
    });
  });
  return tags;
}
