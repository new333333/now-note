import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function addTag(
  repository: RepositorySQLite,
  key: string,
  tag: string
): Promise<string> {
  log.debug(`RepositorySQLite.addTag key=${key} tag=${tag}`);
  if (key === undefined || key === null) {
    return '';
  }
  const note: Note | null = await Note.findByPk(key);
  if (note === null) {
    return '';
  }

  if (note.tags === null || note.tags === undefined) {
    note.tags = '';
  }

  if (note.tags.indexOf(`|${tag}|`) === -1) {
    let newTags = '';
    if (note.tags.length > 0) {
      newTags = note.tags.substring(2, note.tags.length - 2);
      newTags = `${newTags}|${tag}`;
    } else {
      newTags = tag;
    }
    note.tags = `^|${newTags}|$`;
  }

  await note.save();

  return note.tags;
}
