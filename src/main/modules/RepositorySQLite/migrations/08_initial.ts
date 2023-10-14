import log from 'electron-log';
import { QueryInterface } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 08_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await queryInterface.addIndex('Notes', ['parent'], { unique: false });
  await queryInterface.addIndex('Notes', ['parent', 'trash'], {
    unique: false,
  });
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug(
    'RepositorySQLite 87_initial down - there is no way back'
  );
};

module.exports = { up, down };
