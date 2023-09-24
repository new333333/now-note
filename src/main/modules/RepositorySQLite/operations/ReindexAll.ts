import log from 'electron-log';
import { NoteModel, RepositoryIntern } from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

export default async function reindexAll(
  repository: RepositoryIntern,
  key: string | undefined
): Promise<void> {
  log.debug(`RepositorySQLite.reindexAll()`);
  const notes = await NoteModel.findAll({
    where: {
      parent: key === undefined ? null : key,
    },
    order: [['position', 'ASC']],
  });

  notes.forEach(async (note) => {
    await setKeyAndTitlePath(note);

    note.childrenCount = await getChildrenCount(note.key, note.trash);
    log.debug(
      `RepositorySQLite.reindexAll() note.key=${note.key} note.childrenCount=${note.childrenCount}`
    );
    await note.save();

    repository.addNoteIndex(note);
    repository.reindexAll(note.key);
  });
}
