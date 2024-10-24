import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { NoteDTO, SearchResult, SearchResultOptions } from 'types';
import { NoteModel, RepositoryIntern } from '../../DataModels';

const searchLog = log.scope('RepositorySQLite.search');

export default async function search(
  repository: RepositoryIntern,
  searchTextParam: string,
  limit: number,
  trash: boolean,
  options: SearchResultOptions
): Promise<SearchResult> {
  let searchText = searchTextParam;
  let whereNotesIndex = ` `;
  if (searchText === null || searchText === undefined) {
    searchText = '';
  }
  if (searchText && searchText.length > 0 && searchText.trim().length > 0) {
    whereNotesIndex = `${whereNotesIndex} text MATCH :searchText and `;
  }

  let whereNotes = ` `;
  if (options.parentNotesKey && options.parentNotesKey.length) {
    const parentNotesKeyJoined = options.parentNotesKey
      .map((key: string) => ` keyPath like '%/${key}/%' `)
      .join(' or ');
    whereNotes = `${whereNotes} ${parentNotesKeyJoined} and`;
  }

  if (options.excludeNotesKey && options.excludeNotesKey.length) {
    const excludeNotesKeyJoined = options.excludeNotesKey
      .map((key: string) => `'${key}'`)
      .join(',');
    whereNotes = `${whereNotes} key not in (${excludeNotesKeyJoined}) and`;
  }

  if (options.excludeParentNotesKey && options.excludeParentNotesKey.length) {
    const excludeParentNotesKeyJoined = options.excludeParentNotesKey
      .map((key: string) => ` keyPath not like '%/${key}/%' `)
      .join(' or ');
    whereNotes = `${whereNotes} ${excludeParentNotesKeyJoined} and`;
  }

  if (options.types !== undefined) {
    whereNotes = `${whereNotes} type in ('${options.types.join("', '")}') and`;
  }
  if (options.dones && options.dones.length > 0) {
    whereNotes = `${whereNotes} done in (${options.dones.join(', ')}) and`;
  }

  if (options.tags && options.tags.length > 0) {
    const whereTags = options.tags.reduce(
      (accumulator: string, tag: string) =>
        `${accumulator} tags like '%|${tag}|%' or`,
      ''
    );

    if (whereTags.length > 0) {
      whereNotes = `${whereNotes} (${whereTags.substring(0, whereTags.length - 2)}) and`;
    }
  }

  if (
    (options.prioritySign === 'equal' ||
      options.prioritySign === 'lt' ||
      options.prioritySign === 'ltequal' ||
      options.prioritySign === 'gt' ||
      options.prioritySign === 'gtequal') &&
    options.priority !== undefined
  ) {
    let prioritySignSQL;
    if (options.prioritySign === 'equal') {
      prioritySignSQL = '=';
    } else if (options.prioritySign === 'lt') {
      prioritySignSQL = '<';
    } else if (options.prioritySign === 'ltequal') {
      prioritySignSQL = '<=';
    } else if (options.prioritySign === 'gt') {
      prioritySignSQL = '>';
    } else if (options.prioritySign === 'gtequal') {
      prioritySignSQL = '>=';
    }
    whereNotes = `${whereNotes} priority ${prioritySignSQL} ${options.priority} and`;
  }

  whereNotes = `${whereNotes} trash=${trash ? 1 : 0}`;

  let sortBy = 'rank';
  if (options.sortBy) {
    sortBy = options.sortBy;
  } else if (searchText === null || searchText === undefined) {
    sortBy = 'position';
  }

  let orderByNotes = ` `;
  if (sortBy !== 'rank') {
    if (sortBy === 'az') {
      sortBy = 'title asc';
    } else if (sortBy === 'za') {
      sortBy = 'title desc';
    }
    orderByNotes = ` ORDER BY ${sortBy} `;
  }
  const orderByNotesIndex = ` ORDER BY rank `;
  let limitNotesIndex = ' ';
  if (limit > -1) {
    limitNotesIndex = ' LIMIT :limit OFFSET :offset ';
  }

  const selectFromNotesIndex = `select * from notes where key in (SELECT key FROM Notes_index where ${whereNotesIndex} key in (SELECT key FROM Notes where ${whereNotes}) ${orderByNotesIndex}) ${orderByNotes}`;
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

  searchLog.debug("selectResults=");
  searchLog.debug(selectResults);

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
