import log from 'electron-log';
import { NoteModel, RepositoryIntern } from '../../DataModels';

export default async function addTag(
  repository: RepositoryIntern,
  key: string,
  tag: string
): Promise<string> {
  log.debug(`RepositorySQLite.addTag key=${key} tag=${tag}`);
  if (key === undefined || key === null) {
    return '';
  }
  const note: NoteModel | null = await NoteModel.findByPk(key);
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
