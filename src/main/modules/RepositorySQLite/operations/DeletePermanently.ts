import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import {
  NoteModel,
  NoteNotFoundByKeyError,
  RepositoryIntern,
} from '../../DataModels';
import getChildrenCount from './GetChildrenCount';

export default async function deletePermanently(
  repository: RepositoryIntern,
  key: string | undefined
): Promise<boolean> {
  log.debug(`RepositorySQLite.deletePermanently() key=${key}`);

  if (key === undefined) {
    return false;
  }

  const deleteNote = await NoteModel.findByPk(key);
  if (deleteNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

  const { parent } = deleteNote;

  const deteKeyPath = `${deleteNote.keyPath.substring(
    0,
    deleteNote.keyPath.length - 1
  )}%`;

  log.debug(`RepositorySQLite.deletePermanently() deteKeyPath=${deteKeyPath}`);

  await repository
    .getSequelize()!
    .query(
      'DELETE FROM Notes_index where key in (select key from Notes where keyPath LIKE :deteKeyPath)',
      {
        replacements: {
          deteKeyPath,
        },
      }
    );

  await repository
    .getSequelize()!
    .query(
      'DELETE FROM Descriptions where key in (select key from Notes where keyPath LIKE :deteKeyPath)',
      {
        replacements: {
          deteKeyPath,
        },
      }
    );

  await repository
    .getSequelize()!
    .query(
      `DELETE FROM Links where \`from\` in (select key from Notes where keyPath LIKE :deteKeyPath) and type in ('link', null)`,
      {
        replacements: {
          deteKeyPath,
        },
      }
    );

  await repository
    .getSequelize()!
    .query(
      `DELETE FROM Titles where key in (select key from Notes where keyPath LIKE :deteKeyPath)`,
      {
        replacements: {
          deteKeyPath,
        },
      }
    );

  await repository
    .getSequelize()!
    .query(
      `DELETE FROM Notes where key in (select key from Notes where keyPath LIKE :deteKeyPath)`,
      {
        replacements: {
          deteKeyPath,
        },
      }
    );

  // TODO: what to do with assets?

  await repository
    .getSequelize()!
    .query(
      `UPDATE Notes SET position = position - 1 where ${
        deleteNote.parent == null ? 'parent is NULL' : 'parent = :parent'
      } and trash = :trash and position > :position`,
      {
        replacements: {
          parent: deleteNote.parent,
          position: deleteNote.position,
          trash: true,
        },
        type: QueryTypes.SELECT,
      }
    );

  if (parent !== null) {
    const parentNote = await NoteModel.findByPk(parent);
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
