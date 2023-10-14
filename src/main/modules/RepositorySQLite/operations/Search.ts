import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NoteDTO, SearchResult, SearchResultOptions } from 'types';
import { NoteModel, RepositoryIntern } from '../../DataModels';

export default async function search(
  repository: RepositoryIntern,
  searchText: string,
  limit: number,
  trash: boolean,
  options: SearchResultOptions
): Promise<SearchResult> {
  let whereNotesIndex = ` `;
  if (searchText && searchText.length > 0 && searchText.trim().length > 0) {
    whereNotesIndex = `${whereNotesIndex} text MATCH :searchText and `;
  }

  let whereNotes = ` `;
  if (options.parentNotesKey && options.parentNotesKey.length) {
    const parentNotesKeyJoined = options.parentNotesKey
      .map((key: string) => ` parents like '%,${key},%' `)
      .join(' or ');
    whereNotes = `${whereNotes} ${parentNotesKeyJoined} and`;
  }
  if (options.excludeParentNotesKey && options.excludeParentNotesKey.length) {
    const excludeParentNotesKeyJoined = options.excludeParentNotesKey
      .map((key: string) => ` parents not like '%,${key},%' `)
      .join(' or ');
    whereNotes = `${whereNotes} ${excludeParentNotesKeyJoined} and`;
  }

  if (options.types && options.types.length > 0) {
    whereNotes = `${whereNotes} type in (${options.types.join(', ')}) and`;
  }
  if (options.dones && options.dones.length > 0) {
    whereNotes = `${whereNotes} done in (${options.dones.join(', ')}) and`;
  }
  whereNotes = `${whereNotes} trash=${trash ? 1 : 0}`;

  // on Notes_index
  const orderByNotesIndex = ` ORDER BY ${
    options.sortBy ? options.sortBy : 'rank'
  } `;
  let limitNotesIndex = ' ';
  if (limit > -1) {
    limitNotesIndex = ' LIMIT :limit OFFSET :offset ';
  }

  const selectFromNotesIndex = `select * from notes where key in (SELECT key FROM Notes_index where ${whereNotesIndex} key in (SELECT key FROM Notes where ${whereNotes}) ${orderByNotesIndex}) `;
  const selectFromNotesIndexCount = `SELECT count(*) FROM Notes_index where ${whereNotesIndex} key in (SELECT key FROM Notes where ${whereNotes}) `;

  const selectResults: NoteDTO[] = await repository
    .getSequelize()!
    .query<NoteModel>(`${selectFromNotesIndex} ${limitNotesIndex}`, {
      replacements: {
        searchText: `${searchText.trim()} *`,
        limit,
        offset: options.offset,
      },
      raw: true,
      type: QueryTypes.SELECT,
    });

  const countResults: any = await repository
    .getSequelize()!
    .query(`${selectFromNotesIndexCount}`, {
      replacements: {
        searchText: `${searchText} *`,
      },
      raw: true,
      type: QueryTypes.SELECT,
    });

  const searchResult: SearchResult = {
    offset: options.offset || 0,
    limit,
    results: selectResults,
    maxResults: countResults[0]['count(*)'],
  };

  return searchResult;
}
