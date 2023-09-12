import log from 'electron-log';
import { Note } from '../../DataModels';
import { QueryInterface, DataTypes, Sequelize, QueryTypes } from 'sequelize';
import { MigrationFn } from 'umzug';

async function addColumnNotesTags(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'tags', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function migrateTags(sequelize: Sequelize) {
  const tagsResult: any = await sequelize.query(`select key, tag from Tags`, {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const tagsByKey: any = {};
  tagsResult.forEach((row: any) => {
    if (!(row.key in tagsByKey)) {
      tagsByKey[row.key] = [];
    }
    tagsByKey[row.key].push(row.tag);
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, tags] of Object.entries(tagsByKey)) {
    // eslint-disable-next-line no-await-in-loop
    await sequelize.query(`UPDATE Notes SET tags = :tags where key = :key`, {
      replacements: {
        key,
        tags: `^|${tags.join('|')}|$`,
      },
    });
  }
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 05_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnNotesTags(queryInterface);
  await migrateTags(sequelize);
  await queryInterface.dropTable('Tags');
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 05_initial down');
  // there is no back to 04
};

module.exports = { up, down };
