import log from 'electron-log';
import { QueryInterface, DataTypes } from 'sequelize';
import { MigrationFn } from 'umzug';

async function createTableNotes(queryInterface: QueryInterface) {
  await queryInterface.createTable('Notes', {
    key: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionAsText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parent: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    expanded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

async function createTableTitles(queryInterface: QueryInterface) {
  await queryInterface.createTable('Titles', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

async function createTableDescriptions(queryInterface: QueryInterface) {
  await queryInterface.createTable('Descriptions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionAsText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

async function createTableTags(queryInterface: QueryInterface) {
  await queryInterface.createTable('Tags', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

async function createTableLinks(queryInterface: QueryInterface) {
  await queryInterface.createTable('Links', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    to: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

async function createTableAssets(queryInterface: QueryInterface) {
  await queryInterface.createTable('Assets', {
    key: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });
}

export const up: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 00_initial up');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();
  await createTableNotes(queryInterface);
  await createTableTitles(queryInterface);
  await createTableDescriptions(queryInterface);
  await createTableTags(queryInterface);
  await createTableLinks(queryInterface);
  await createTableAssets(queryInterface);
};

export const down: MigrationFn = async ({ context: sequelize }) => {
  log.debug('RepositorySQLite 00_initial down');
  const queryInterface: QueryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('Notes');
  await queryInterface.dropTable('Titles');
  await queryInterface.dropTable('Descriptions');
  await queryInterface.dropTable('Tags');
  await queryInterface.dropTable('Links');
  await queryInterface.dropTable('Assets');
};

module.exports = { up, down };
