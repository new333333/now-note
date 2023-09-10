
import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { Note, NoteNotFoundByKeyError } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';


export default async function moveNoteToTrash(
  repository: RepositorySQLite,
  key: string | undefined
): Promise<boolean> {
  if (key === undefined) {
    return false;
  }

  const modifyNote = await Note.findByPk(key);
  if (modifyNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  const prevKeyPath = modifyNote.keyPath;
  const prevTitlePath = modifyNote.titlePath;

  await repository
    .getSequelize()!
    .query(
      `UPDATE Notes SET position = position - 1 where ${
        modifyNote.parent === null ? 'parent is NULL' : 'parent = :parent'
      } and trash = :trash and position > :position`,
      {
        replacements: {
          parent: modifyNote.parent,
          position: modifyNote.position,
          trash: false,
        },
        type: QueryTypes.SELECT,
      }
    );

  const max: number = await Note.max('position', {
    where: {
      parent: null,
      trash: true,
    },
  });

  modifyNote.restoreParentKey = modifyNote.parent;
  modifyNote.parent = null;
  modifyNote.position = max === null ? 0 : max + 1;
  modifyNote.trash = true;
  modifyNote.keyPath = `^/${modifyNote.key}/$`;
  modifyNote.titlePath = `^/${modifyNote.title}/$`;

  modifyNote.save();

  const trash = true;

  await repository.updateNoteKeyPath(prevKeyPath, modifyNote.keyPath);
  await repository.updateNoteTitlePath(
    prevTitlePath,
    modifyNote.titlePath,
    modifyNote.keyPath
  );

  await repository.updateTrashFlag(modifyNote.keyPath, trash);

  await repository.addNoteIndex(modifyNote);
  return true;
}
