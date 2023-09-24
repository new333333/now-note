import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize, QueryTypes } from 'sequelize';
import { MigrationFn } from 'umzug';


async function createTableSettings(queryInterface: QueryInterface) {
  await queryInterface.createTable('Settings', {
    detailsNoteKey: {
      type: DataTypes.UUID,
    },
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 06_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await createTableSettings(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 06_initial down');
  // there is no back to 04
};

module.exports = { up, down };
