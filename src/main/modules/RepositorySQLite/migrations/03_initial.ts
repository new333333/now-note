import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function dropTableNotesIndex(queryInterface: QueryInterface) {
  await queryInterface.dropTable('Notes_index');
}

async function createTableNotesIndex(sequelize: Sequelize) {
  await sequelize.query(
    `CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, text, prefix='1 2 3')`
  );
}

async function addColumnTitlePathToTableNotes(
  queryInterface: QueryInterface
) {
  await queryInterface.addColumn('Notes', 'titlePath', {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
  });
}

async function addColumnKeyPathToTableNotes(
  queryInterface: QueryInterface
) {
  await queryInterface.addColumn('Notes', 'keyPath', {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 03_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await dropTableNotesIndex(queryInterface);
  await createTableNotesIndex(sequelize);
  await addColumnTitlePathToTableNotes(queryInterface);
  await addColumnKeyPathToTableNotes(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 03_initial down - there is no way back');
};

module.exports = { up, down };
