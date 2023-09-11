/* eslint-disable no-use-before-define */
/* eslint max-classes-per-file: ["error", 99] */
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export const SQLITE3_TYPE: string = 'sqlite3';

export class Note extends Model<
  InferAttributes<Note>,
  InferCreationAttributes<Note>
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

  declare linkToKey: string | null;

  declare keyPath: string;

  declare titlePath: string;

  declare childrenCount: number;
}

export class NotesIndex extends Model<
  InferAttributes<NotesIndex>,
  InferCreationAttributes<NotesIndex>
> {
  declare key: CreationOptional<string>;

  declare text: string | null;
}

export class Asset extends Model<
  InferAttributes<Asset>,
  InferCreationAttributes<Asset>
> {
  declare key: CreationOptional<string>;

  declare type: string | null;

  declare name: string;

  declare createdBy: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class Description extends Model<
  InferAttributes<Description>,
  InferCreationAttributes<Description>
> {
  declare id: CreationOptional<number>;

  declare key: string;

  declare description: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class Link extends Model<
  InferAttributes<Link>,
  InferCreationAttributes<Link>
> {
  declare id: CreationOptional<number>;

  declare from: string;

  declare to: string;

  declare type: string | null;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class Tag extends Model<
  InferAttributes<Tag>,
  InferCreationAttributes<Tag>
> {
  declare id: CreationOptional<number>;

  declare key: string;

  declare tag: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class Title extends Model<
  InferAttributes<Title>,
  InferCreationAttributes<Title>
> {
  declare id: CreationOptional<number>;

  declare key: string;

  declare title: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class NoteNotFoundByKeyError extends Error {
  private key: string | null | undefined;

  constructor(key: string | null | undefined) {
    super(`Note not found by key: ${key}"`);
    this.key = key;
  }
}
