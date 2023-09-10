import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { Note, NoteNotFoundByKeyError } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';

export default async function restore(
  repository: RepositorySQLite,
  key: string | undefined
): Promise<boolean> {
  log.debug(`RepositorySQLite.restore()...`);
  if (key === undefined) {
    return false;
  }

  const modifyNote = await Note.findByPk(key);
  if (modifyNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  const prevTitlePath = modifyNote.titlePath;
  const prevKeyPath = modifyNote.keyPath;

  await repository
    .getSequelize()!
    .query(
      `UPDATE Notes SET position = position - 1 where ${
        modifyNote.parent == null ? 'parent is NULL' : 'parent = :parent'
      } and trash = :trash and position > :position`,
      {
        replacements: {
          parent: modifyNote.parent,
          position: modifyNote.position,
          trash: true,
        },
        type: QueryTypes.SELECT,
      }
    );

  const max: number = await Note.max('position', {
    where: {
      parent: modifyNote.parent,
      trash: false,
    },
  });
  modifyNote.position = max == null ? 0 : max + 1;

  modifyNote.parent = modifyNote.restoreParentKey;
  modifyNote.restoreParentKey = null;
  modifyNote.trash = false;

  await setKeyAndTitlePath(modifyNote);

  modifyNote.save();

  log.debug(
    `RepositorySQLite.restore() modifyNote.parent=${modifyNote.parent}, modifyNote.keyPath=${modifyNote.keyPath}, modifyNote.titlePath=${modifyNote.titlePath}`
  );
  log.debug(
    `RepositorySQLite.restore() prevKeyPath=${prevKeyPath}, prevTitlePath=${prevTitlePath}`
  );

  await repository.updateNoteKeyPath(prevKeyPath, modifyNote.keyPath);
  await repository.updateNoteTitlePath(
    prevTitlePath,
    modifyNote.titlePath,
    modifyNote.keyPath
  );

  await repository.updateTrashFlag(modifyNote.keyPath, modifyNote.trash);

  await repository.addNoteIndex(modifyNote);
  return true;
}
