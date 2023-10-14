import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize, QueryTypes } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

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

async function deleteNotesIndex(sequelize: Sequelize) {
  await sequelize.query(`delete from Notes_index`);
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 06_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnNotesTags(queryInterface);
  await migrateTags(sequelize);
  await queryInterface.dropTable('Tags');
  await deleteNotesIndex(sequelize);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 06_initial down - there is no way back');
};

module.exports = { up, down };
