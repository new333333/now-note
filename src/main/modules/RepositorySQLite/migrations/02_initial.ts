import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

const repositorySQLiteSetupLog = log.scope('RepositorySQLiteSetup');

async function addColumnLinkstype(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Links', 'type', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function addColumnNotesLinkToKey(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'linkToKey', {
    type: DataTypes.UUID,
    allowNull: true,
    unique: false,
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 02_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnLinkstype(queryInterface);
  await addColumnNotesLinkToKey(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  repositorySQLiteSetupLog.debug('RepositorySQLite 02_initial down - there is no way back');
};

module.exports = { up, down };
