import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import * as cheerio from 'cheerio';
import { NoteModel, NotesIndexModel, RepositoryIntern } from '../../DataModels';

// TODO: add tags to note index
export default async function addNoteIndex(
  repository: RepositoryIntern,
  note: NoteModel
): Promise<void> {
  if (note === null) {
    return;
  }

  const descriptionCheerio = cheerio.load(note.description || '', null, false);

  await repository.deleteNoteIndex(note.key);

  await repository
    .getSequelize()!
    .query<NotesIndexModel>(
      'INSERT INTO Notes_index (key, text) VALUES (:key, :text)',
      {
        replacements: {
          key: note.key,
          text: `${note.title} ${descriptionCheerio.text()}`,
        },
        type: QueryTypes.INSERT, // ignore this error, this is the right type
      }
    );
}
