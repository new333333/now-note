import log from 'electron-log';
import {
  Description,
  Link,
  Note,
  NoteNotFoundByKeyError,
  Tag,
  Title,
} from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';
import { Op, QueryTypes } from 'sequelize';

export default async function deletePermanently(
  repository: RepositorySQLite,
  key: string | undefined
): Promise<boolean> {
  log.debug(`RepositorySQLite.deletePermanently() key=${key}`);

  if (key === undefined) {
    return false;
  }

  const deleteNote = await Note.findByPk(key);
  if (deleteNote === null) {
    throw new NoteNotFoundByKeyError(key);
  }

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
      `DELETE FROM Tags where key in (select key from Notes where keyPath LIKE :deteKeyPath)`,
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

  /*
  const children = await Note.findAll({
    where: {
      parent: key,
      trash: true,
    },
  });

  for (let i = 0; i < children.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await repository.deletePermanently(children[i].key, true);
  }
*/

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

  // repository.deleteNoteIndex(key);
  /*
  await Description.destroy({
    where: {
      key,
    },
  });
  */
  /*
  await Link.destroy({
    where: {
      from: key,
      type: {
        [Op.or]: {
          [Op.lt]: 'link',
          [Op.eq]: null,
        },
      },
    },
  });
  */
  /*
  await Tag.destroy({
    where: {
      key,
    },
  });
  */
  /*
  await Title.destroy({
    where: {
      key,
    },
  });
  */
  // deleteNote.destroy();
  return true;
}
