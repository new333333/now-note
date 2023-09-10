import log from 'electron-log';
import { DataTypes } from 'sequelize';
import { Asset, Description, Link, Note, NotesIndex, Tag, Title } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function authenticate(repository: RepositorySQLite) {
  log.debug(`RepositorySQLite.authenticate()...`);
  await repository.getSequelize().authenticate();

  NotesIndex.init(
    {
      key: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize: repository.getSequelize(),
      tableName: 'Notes_index',
    }
  );

  Note.init(
    {
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
      restoreParentKey: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: false,
      },
      linkToKey: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      keyPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      titlePath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize: repository.getSequelize(),
      indexes: [
        {
          unique: false,
          fields: ['parent'],
        },
      ],
    }
  );

  Title.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: repository.getSequelize(),
    }
  );

  Description.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: repository.getSequelize(),
    }
  );

  Tag.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tag: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: repository.getSequelize(),
    }
  );

  Link.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      from: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      to: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: repository.getSequelize(),
    }
  );

  Asset.init(
    {
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
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: repository.getSequelize(),
    }
  );

  const isIndexed: boolean = await repository.isIndexed();
  log.debug(`RepositorySQLite.authenticate() isIndexed=${isIndexed}`);

  if (!isIndexed) {
    await repository.reindexAll(undefined);
  }
}
