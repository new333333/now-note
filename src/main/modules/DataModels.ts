/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint max-classes-per-file: ["error", 99] */
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
} from 'sequelize';
import {
  AssetDTO,
  CreatedLinkInDTO,
  OpenHistoryDTO,
  MoveToDTO,
  NoteDTO,
  Repository,
  SettingsDTO,
} from 'types';

export const SQLITE3_TYPE: string = 'sqlite3';

export class NoteModel extends Model<
  InferAttributes<NoteModel>,
  InferCreationAttributes<NoteModel>
> {
  declare key: CreationOptional<string>;

  declare title: string;

  declare description: string | null;

  declare parent: string | null;

  declare position: number;

  declare type: string;

  declare createdBy: string;

  declare done: boolean;

  declare priority: number;

  declare expanded: boolean;

  declare trash: boolean;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare restoreParentKey: CreationOptional<string | null>;

  declare keyPath: string;

  declare titlePath: string;

  declare childrenCount: number;

  declare tags: string;

  toDTO(): NoteDTO {
    return this.dataValues;
  }
}

export class NotesIndexModel extends Model<
  InferAttributes<NotesIndexModel>,
  InferCreationAttributes<NotesIndexModel>
> {
  declare key: CreationOptional<string>;

  declare text: string | null;
}

export class AssetModel extends Model<
  InferAttributes<AssetModel>,
  InferCreationAttributes<AssetModel>
> {
  declare key: CreationOptional<string>;

  declare type: string | null;

  declare name: string;

  declare createdBy: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  toDTO(): AssetDTO {
    return this.dataValues;
  }
}

export class DescriptionModel extends Model<
  InferAttributes<DescriptionModel>,
  InferCreationAttributes<DescriptionModel>
> {
  declare id: CreationOptional<number>;

  declare key: string;

  declare description: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class LinkModel extends Model<
  InferAttributes<LinkModel>,
  InferCreationAttributes<LinkModel>
> {
  declare id: CreationOptional<number>;

  declare from: string;

  declare to: string;

  declare type: string | null;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class TitleModel extends Model<
  InferAttributes<TitleModel>,
  InferCreationAttributes<TitleModel>
> {
  declare id: CreationOptional<number>;

  declare key: string;

  declare title: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class SettingsModel extends Model<
  InferAttributes<SettingsModel>,
  InferCreationAttributes<SettingsModel>
> {
  declare id: CreationOptional<number>;

  declare detailsNoteKey: string | null;

  toDTO(): SettingsDTO {
    return this.dataValues;
  }
}

export class MoveToModel extends Model<
  InferAttributes<MoveToModel>,
  InferCreationAttributes<MoveToModel>
> {
  declare id: CreationOptional<number>;

  declare key: string | null;

  toDTO(): MoveToDTO {
    return this.dataValues;
  }
}

export class CreatedLinkInModel extends Model<
  InferAttributes<CreatedLinkInModel>,
  InferCreationAttributes<CreatedLinkInModel>
> {
  declare id: CreationOptional<number>;

  declare key: string | null;

  toDTO(): CreatedLinkInDTO {
    return this.dataValues;
  }
}

export class OpenHistoryModel extends Model<
  InferAttributes<OpenHistoryModel>,
  InferCreationAttributes<OpenHistoryModel>
> {
  declare id: CreationOptional<number>;

  declare key: string | null;

  toDTO(): OpenHistoryDTO {
    return this.dataValues;
  }
}

export class NoteNotFoundByKeyError extends Error {
  private key: string | null | undefined;

  constructor(key: string | null | undefined) {
    super(`Note not found by key: ${key}"`);
    this.key = key;
  }
}

export interface RepositoryIntern extends Repository {
  getUserName(): string;
  getSequelize(): Sequelize;
  prepareDescriptionToSave(key: string, html: string): Promise<string>;
  updateNoteTitlePath(
    oldTitlePathParam: string,
    newTitlePathParam: string,
    keyPathParam: string
  ): Promise<void>;
  addNoteIndex(note: NoteModel): Promise<void>;
  deleteNoteIndex(key: string): Promise<void>;
  updateNoteKeyPath(
    oldKeyPathParam: string,
    newKeyPathParam: string
  ): Promise<void>;
  updateTrashFlag(key: string, trash: boolean): Promise<void>;
  addLocalFile(
    fileType: string | null,
    fileName: string,
    filePath: string
  ): Promise<AssetModel>;
}
