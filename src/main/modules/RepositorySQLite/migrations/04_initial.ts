import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

async function addColumnNotesChildrenCount(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'childrenCount', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 02_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnNotesChildrenCount(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 04_initial down');
  // there is no back to 01
};

module.exports = { up, down };
