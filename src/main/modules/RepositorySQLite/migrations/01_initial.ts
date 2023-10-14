import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function addIndexNotesParent(queryInterface: QueryInterface) {
  await queryInterface.addIndex('Notes', ['parent'], { unique: false });
}

async function addColumnNotesRestoreParentKey(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'restoreParentKey', {
    type: DataTypes.UUID,
    allowNull: true,
    unique: false,
  });
}

async function createTableNotesIndex(sequelize: Sequelize) {
  await sequelize.query(
    `CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, path, parents, title, descriptionAsText, tags, type, done, priority, trash, prefix='1 2 3')`
  );
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 01_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addIndexNotesParent(queryInterface);
  await addColumnNotesRestoreParentKey(queryInterface);
  await createTableNotesIndex(sequelize);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 01_initial down - there is no way back');
};

module.exports = { up, down };
