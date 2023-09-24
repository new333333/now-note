import log from 'electron-log';
import { NoteModel } from '../DataModels';

export function getPath(
  parentsPath: string | null | undefined,
  element: string | null | undefined
) {
  if (
    (parentsPath === undefined || parentsPath === null || parentsPath === '') &&
    (element === null || element === undefined || element === '')
  ) {
    return '^$';
  }

  // parent is root
  if (
    parentsPath === undefined ||
    parentsPath === null ||
    parentsPath === '' ||
    parentsPath === '^$'
  ) {
    return `^/${element}/$`;
  }

  const parentsPathWithStartAndEnd = parentsPath.substring(
    1,
    parentsPath.length - 1
  );

  return `^${parentsPathWithStartAndEnd}${element}/$`;
}

export async function getKeyAndTitlePath(
  parent: string | null,
  restoreParentKey: string | null,
  trash: boolean,
  key: string,
  title: string
) {
  let parentNote: NoteModel | null = null;

  if (
    (!trash && parent !== null) ||
    (trash && restoreParentKey === null && parent !== null)
  ) {
    parentNote = await NoteModel.findByPk(parent);
  }

  log.debug(`RepositorySQLite->getKeyAndTitlePath() parentNote=${parentNote}`);

  const keyPath = getPath(parentNote !== null ? parentNote.keyPath : '^$', key);
  const titlePath = getPath(
    parentNote !== null ? parentNote.titlePath : '^$',
    title
  );

  log.debug(
    `RepositorySQLite->getKeyAndTitlePath() keyPath=${keyPath} titlePath=${titlePath}`
  );

  return [keyPath, titlePath];
}

export async function getKeyAndTitlePathOnNote(note: NoteModel) {
  return getKeyAndTitlePath(
    note.parent,
    note.restoreParentKey,
    note.trash,
    note.key,
    note.title
  );
}

export async function setKeyAndTitlePath(note: NoteModel) {
  const [keyPath, titlePath] = await getKeyAndTitlePathOnNote(note);
  log.debug(
    `RepositorySQLite->setKeyAndTitlePath() keyPath=${keyPath} titlePath=${titlePath}`
  );
  note.keyPath = keyPath;
  note.titlePath = titlePath;
}
