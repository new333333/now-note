import log from 'electron-log';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { MigrationFn } from 'umzug';

async function addColumnLinkstype(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Links', 'type', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function removeColumnLinkstype(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('Links', 'type');
}

async function addColumnNotesLinkToKey(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'linkToKey', {
    type: DataTypes.UUID,
    allowNull: true,
    unique: false,
  });
}

async function removeColumnNotesLinkToKey(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('Notes', 'linkToKey');
}

async function addIndexNotesParent(queryInterface: QueryInterface) {
  await queryInterface.addIndex('Notes', ['parent'], { unique: false });
}

async function removeIndexNotesParent(queryInterface: QueryInterface) {
  await queryInterface.removeIndex('Notes', ['parent']);
}

async function addColumnNotesRestoreParentKey(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Notes', 'restoreParentKey', {
    type: DataTypes.UUID,
    allowNull: true,
    unique: false,
  });
}

async function removeColumnNotesRestoreParentKey(
  queryInterface: QueryInterface
) {
  await queryInterface.removeColumn('Notes', 'restoreParentKey');
}

async function createTableNotesIndex(sequelize: Sequelize) {
  await sequelize.query(
    `CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, path, parents, title, descriptionAsText, tags, type, done, priority, trash, prefix='1 2 3')`
  );
}

async function dropTableNotesIndex(queryInterface: QueryInterface) {
  await queryInterface.dropTable('Notes_index');
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await addColumnLinkstype(queryInterface);
  await addColumnNotesLinkToKey(queryInterface);
  await addIndexNotesParent(queryInterface);
  await addColumnNotesRestoreParentKey(queryInterface);
  await createTableNotesIndex(sequelize);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await removeColumnLinkstype(queryInterface);
  await removeColumnNotesLinkToKey(queryInterface);
  await removeIndexNotesParent(queryInterface);
  await removeColumnNotesRestoreParentKey(queryInterface);
  await dropTableNotesIndex(queryInterface);
};

module.exports = { up, down };
