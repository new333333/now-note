import log from 'electron-log';
import { QueryInterface, Sequelize } from 'sequelize';
import { MigrationParams } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

export const up = async ({
  context: sequelize,
}: MigrationParams<Sequelize>) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 10_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('Notes', 'linkToKey');
};

export const down = async ({
  context: sequelize,
}: MigrationParams<Sequelize>) => {
  repositorySQLiteSetupLog.debug(
    'RepositorySQLite 10_initial down - there is no way back'
  );
};

module.exports = { up, down };
