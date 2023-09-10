import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

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
  log.debug('RepositorySQLite 02_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await removeColumnDescriptionAsTextsFromTableNotes(queryInterface);
  await removeColumnDescriptionAsTextsFromTableDescription(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 02_initial down');
  // there is no back to 01
};

module.exports = { up, down };
