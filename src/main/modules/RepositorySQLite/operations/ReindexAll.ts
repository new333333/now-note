import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';

export default async function reindexAll(
  repository: RepositorySQLite,
  key: string | undefined
) {
  log.debug(`RepositorySQLite.reindexAll()`);
  const notes = await Note.findAll({
    where: {
      parent: key === undefined ? null : key,
    },
    order: [['position', 'ASC']],
  });

  notes.forEach(async (note) => {
    await setKeyAndTitlePath(note);
    await note.save();

    repository.addNoteIndex(note);
    repository.reindexAll(note.key);
  });
}
