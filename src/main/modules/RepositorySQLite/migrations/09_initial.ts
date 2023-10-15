import log from 'electron-log';
import { DataTypes, QueryInterface } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 09_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('MoveTo', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.UUID,
    },
  });

};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug(
    'RepositorySQLite 09_initial down - there is no way back'
  );
};

module.exports = { up, down };
