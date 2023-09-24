import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import {
  NoteModel,
  NoteNotFoundByKeyError,
  RepositoryIntern,
} from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

export default async function restore(
  repository: RepositoryIntern,
  key: string | undefined
): Promise<boolean> {
  log.debug(`RepositorySQLite.restore()...`);
  if (key === undefined) {
    return false;
  }

  const modifyNote = await NoteModel.findByPk(key);
  if (modifyNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  const prevTitlePath = modifyNote.titlePath;
  const prevKeyPath = modifyNote.keyPath;
  const prevParent = modifyNote.parent;

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

  const max: number = await NoteModel.max('position', {
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

  if (modifyNote.parent !== null) {
    const parentNote = await NoteModel.findByPk(modifyNote.parent);
    if (parentNote !== null) {
      parentNote.childrenCount = await getChildrenCount(
        parentNote.key,
        parentNote.trash
      );
      parentNote.save();
    }
  }
  if (prevParent !== null) {
    const parentNote = await NoteModel.findByPk(prevParent);
    if (parentNote !== null) {
      parentNote.childrenCount = await getChildrenCount(
        parentNote.key,
        parentNote.trash
      );
      parentNote.save();
    }
  }

  return true;
}
