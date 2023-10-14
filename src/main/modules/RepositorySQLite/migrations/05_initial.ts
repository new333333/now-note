import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function addColumnNotesChildrenCount(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'childrenCount', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 05_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnNotesChildrenCount(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 05_initial down - there is no way back');
};

module.exports = { up, down };
