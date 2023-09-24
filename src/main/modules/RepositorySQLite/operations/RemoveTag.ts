import log from 'electron-log';
import { NoteModel, RepositoryIntern } from '../../DataModels';

export default async function removeTag(
  repository: RepositoryIntern,
  key: string,
  tag: string
): Promise<string> {
  if (key === undefined || key === null) {
    return '';
  }
  const note: NoteModel | null = await NoteModel.findByPk(key);
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
