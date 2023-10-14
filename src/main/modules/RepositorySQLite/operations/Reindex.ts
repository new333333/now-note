/* eslint-disable no-await-in-loop */
import log from 'electron-log';
import { NoteModel, RepositoryIntern } from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

const reindexLog = log.scope('RepositorySQLite.reindex');

export default async function reindex(
  repository: RepositoryIntern,
  key: string | undefined
): Promise<void> {
  reindexLog.debug(`RepositorySQLite.reindex() key=${key}`);

  if (key === undefined) {
    await repository.getSequelize()!.query('DELETE FROM Notes_index');
  } else {
    const note: NoteModel | null = await NoteModel.findByPk(key);
    if (note !== null) {
      await repository
        .getSequelize()!
        .query(
          `DELETE FROM Notes_index where key in (select key from Notes where parent like :parent)`,
          {
            replacements: {
              parent: `${note.keyPath.substring(0, note.keyPath.length - 1)}%`,
            },
          }
        );
    }
  }

  const notes = await NoteModel.findAll({
    where: {
      parent: key === undefined ? null : key,
    },
    order: [['position', 'ASC']],
  });

  for (let i = 0; i < notes.length; i += 1) {
    const note = notes[i];
    await setKeyAndTitlePath(note);

    note.childrenCount = await getChildrenCount(note.key, note.trash);
    reindexLog.debug(
      `RepositorySQLite.reindex() note.key=${note.key} note.childrenCount=${note.childrenCount}`
    );
    await note.save();
    // await repository.addNoteIndex(note);
    await repository.reindex(note.key);
  }

  const reindexNotes = await NoteModel.findAll({
    where: {
      parent: key === undefined ? null : key,
    },
    order: [['position', 'ASC']],
  });

  for (let i = 0; i < reindexNotes.length; i += 1) {
    const note = notes[i];
    await repository.addNoteIndex(note);
  }
}
