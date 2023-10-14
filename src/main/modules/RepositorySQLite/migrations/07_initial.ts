import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize, QueryTypes } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function createTableSettings(queryInterface: QueryInterface) {
  await queryInterface.createTable('Settings', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    detailsNoteKey: {
      type: DataTypes.UUID,
    },
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 07_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await createTableSettings(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 07_initial down - there is no way back');
};

module.exports = { up, down };
