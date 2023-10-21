import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { HitMode } from 'types';
import {
  NoteModel,
  NoteNotFoundByKeyError,
  RepositoryIntern,
} from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';


const moveNoteLog = log.scope('RepositorySQLite.moveNote');

export default async function moveNote(
  repository: RepositoryIntern,
  key: string,
  to: string | undefined,
  hitMode: HitMode
): Promise<void> {
  moveNoteLog.debug(
    `RepositorySQLite.moveNote() key=, to=, hitMode=`,
    key,
    to,
    hitMode
  );

  let toLocal: string | null = null;
  if (to !== undefined) {
    toLocal = to;
  }

  const modifyNote = await NoteModel.findByPk(key);
  if (modifyNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  if (modifyNote.trash) {
    moveNoteLog.debug(`RepositorySQLite.moveNote() note in trash, ignore move`);
    return;
  }

  const prevParent = modifyNote.parent;
  const prevKeyPath = modifyNote.keyPath;
  const prevTitlePath = modifyNote.titlePath;

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
    const max: number = await NoteModel.max('position', {
      where: {
        parent: toLocal,
        trash: false,
      },
    });

    modifyNote.position = max == null ? 0 : max + 1;
  } else if (hitMode === 'before') {
    const relativNote = await NoteModel.findByPk(to);
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(to);
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
    const relativNote = await NoteModel.findByPk(to);
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(to);
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
  await modifyNote.save();

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
      const newNote = await NoteModel.findByPk(modifyNote.parent);
      if (newNote !== null) {
        newNote.childrenCount = await getChildrenCount(
          newNote.key,
          newNote.trash
        );
        await newNote.save();
      }
    }

    if (prevParent !== null) {
      const prevParentNote = await NoteModel.findByPk(prevParent);
      if (prevParentNote !== null) {
        prevParentNote.childrenCount = await getChildrenCount(
          prevParentNote.key,
          prevParentNote.trash
        );
        await prevParentNote.save();
      }
    }

    await repository.addMoveTo(modifyNote.parent);
  }
}
