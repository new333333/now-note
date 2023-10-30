import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 13_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();
  return Promise.all([
    queryInterface.changeColumn('Notes', 'childrenCount', {
      type: DataTypes.INTEGER,
    }),
  ]);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 13_initial down - there is no way back');
};

module.exports = { up, down };
