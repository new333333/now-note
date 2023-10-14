import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function removeColumnDescriptionAsTextsFromTableNotes(
  queryInterface: QueryInterface
) {
  await queryInterface.removeColumn('Notes', 'descriptionAsText');
}

async function removeColumnDescriptionAsTextsFromTableDescription(
  queryInterface: QueryInterface
) {
  await queryInterface.removeColumn('Descriptions', 'descriptionAsText');
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 04_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await removeColumnDescriptionAsTextsFromTableNotes(queryInterface);
  await removeColumnDescriptionAsTextsFromTableDescription(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 04_initial down - there is no way back');
};

module.exports = { up, down };
