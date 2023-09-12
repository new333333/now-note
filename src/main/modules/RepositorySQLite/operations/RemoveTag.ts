import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function removeTag(
  repository: RepositorySQLite,
  key: string,
  tag: string
): Promise<string> {
  if (key === undefined || key === null) {
    return '';
  }
  const note: Note | null = await Note.findByPk(key);
  if (note === null) {
    return '';
  }
  note.tags = note.tags.replace(`|${tag}|`, `|`);

  // removed last one
  if (note.tags === '^|$') {
    note.tags = '';
  }

  await note.save();

  return note.tags;
}
