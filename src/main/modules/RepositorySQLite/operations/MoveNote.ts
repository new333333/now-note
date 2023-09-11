import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { HitMode } from 'types';
import { Note, NoteNotFoundByKeyError } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import { getPath, setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

export default async function moveNote(
  repository: RepositorySQLite,
  key: string,
  from: string,
  to: string | undefined,
  hitMode: HitMode,
  relativTo: string
): Promise<void> {
  log.debug(`RepositorySQLite.moveNote()...`);

  let toLocal: string | null = null;
  if (to !== undefined) {
    toLocal = to;
  }

  const modifyNote = await Note.findByPk(key);
  if (modifyNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  const prevParent = modifyNote.parent;
  const prevKeyPath = modifyNote.keyPath;
  const prevTitlePath = modifyNote.titlePath;

  // count parent and position
  if (hitMode === 'over') {
    await repository
      .getSequelize()
      .query(
        `UPDATE Notes SET position = position - 1 where ${
          modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
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

    modifyNote.parent = toLocal;
    const max: number = await Note.max('position', {
      where: {
        parent: toLocal,
        trash: false,
      },
    });

    modifyNote.position = max == null ? 0 : max + 1;
  } else if (hitMode === 'before') {
    const relativNote = await Note.findByPk(relativTo);
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(relativTo);
    }

    if (modifyNote.parent === relativNote.parent) {
      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL' : 'parent = :parent'
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

      await relativNote.reload();

      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position >= :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

      modifyNote.parent = relativNote.parent;
      modifyNote.position = relativNote.position;
    } else {
      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
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

      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position >= :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

      modifyNote.parent = relativNote.parent;
      modifyNote.position = relativNote.position;
    }
  } else if (hitMode === 'after') {
    const relativNote = await Note.findByPk(relativTo);
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(relativTo);
    }

    if (modifyNote.parent === relativNote.parent) {
      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
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

      await relativNote.reload();

      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

      modifyNote.position += 1;
    } else {
      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent === null ? 'parent is NULL ' : 'parent = :parent'
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

      await repository
        .getSequelize()
        .query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent === null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

      modifyNote.parent = relativNote.parent;
      modifyNote.position = relativNote.position + 1;
    }
  }

  await setKeyAndTitlePath(modifyNote);
  log.debug(
    `RepositorySQLite.moveNote() modifyNote.keyPath=${modifyNote.keyPath} modifyNote.parent=${modifyNote.parent} modifyNote.titlePath=${modifyNote.titlePath}`
  );
  modifyNote.save();

  if (prevParent !== modifyNote.parent) {
    // 1. move e-f to root
    //  was:
    //    keyPath: ^/a-b/c-d/$
    //    child's keyPath: ^/a-b/c-d/e-f/$
    //  is:
    //    keyPath:
    //    child's keyPath: ^/e-f/$
    //
    //    prevKeyPath: ^/a-b/c-d/$
    //    newKeyPath: ^/$
    //
    // 2. move e-f to 1-2
    //  was:
    //    keyPath: ^/a-b/c-d/$
    //    child's keyPath: ^/a-b/c-d/e-f/$
    //  is:
    //    keyPath: ^/1-2/$
    //    child's keyPath: ^/1-2/e-f/$

    await repository.updateNoteKeyPath(prevKeyPath, modifyNote.keyPath);

    log.debug(`RepositorySQLite.moveNote() prevTitlePath=${prevTitlePath}`);

    await repository.updateNoteTitlePath(
      prevTitlePath,
      modifyNote.titlePath,
      modifyNote.keyPath
    );

    if (modifyNote.parent !== null) {
      const newNote = await Note.findByPk(modifyNote.parent);
      if (newNote !== null) {
        newNote.childrenCount = await getChildrenCount(
          newNote.key,
          newNote.trash
        );
        newNote.save();
      }
    }

    if (prevParent !== null) {
      const prevParentNote = await Note.findByPk(prevParent);
      if (prevParentNote !== null) {
        prevParentNote.childrenCount = await getChildrenCount(
          prevParentNote.key,
          prevParentNote.trash
        );
        prevParentNote.save();
      }
    }
  }
}
