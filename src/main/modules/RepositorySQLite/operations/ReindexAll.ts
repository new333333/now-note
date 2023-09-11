import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

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

    note.childrenCount = await getChildrenCount(note.key, note.trash);
    log.debug(
      `RepositorySQLite.reindexAll() note.key=${note.key} childrenCount=${childrenCount}`
    );
    await note.save();

    repository.addNoteIndex(note);
    repository.reindexAll(note.key);
  });
}
