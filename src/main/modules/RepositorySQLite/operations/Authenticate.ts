import log from 'electron-log';
import { DataTypes } from 'sequelize';
import {
  AssetModel,
  CreatedLinkInModel,
  DescriptionModel,
  LinkModel,
  MoveToModel,
  NoteModel,
  NotesIndexModel,
  RepositoryIntern,
  SettingsModel,
  TitleModel,
} from '../../DataModels';

export default async function authenticate(
  repository: RepositoryIntern
): Promise<void> {
  log.debug(`RepositorySQLite.authenticate()...`);
  await repository.getSequelize().authenticate();

  NotesIndexModel.init(
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

  NoteModel.init(
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
      childrenCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      tags: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize: repository.getSequelize(),
      tableName: 'Notes',
      indexes: [
        {
          unique: false,
          fields: ['parent'],
        },
      ],
    }
  );

  TitleModel.init(
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
      tableName: 'Titles',
    }
  );

  DescriptionModel.init(
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
      tableName: 'Descriptions',
    }
  );

  LinkModel.init(
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
      tableName: 'Links',
    }
  );

  AssetModel.init(
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
      tableName: 'Assets',
    }
  );

  SettingsModel.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      detailsNoteKey: {
        type: DataTypes.UUID,
      },
    },
    {
      sequelize: repository.getSequelize(),
      tableName: 'Settings',
      timestamps: false,
    }
  );

  MoveToModel.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.UUID,
      },
    },
    {
      sequelize: repository.getSequelize(),
      tableName: 'MoveTo',
      timestamps: false,
    }
  );

  CreatedLinkInModel.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.UUID,
      },
    },
    {
      sequelize: repository.getSequelize(),
      tableName: 'CreatedLinkIn',
      timestamps: false,
    }
  );
}
