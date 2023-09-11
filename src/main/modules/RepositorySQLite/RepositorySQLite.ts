/* eslint-disable class-methods-use-this */
/* eslint max-classes-per-file: ["error", 99] */
import log from 'electron-log';
import { Sequelize, DataTypes, Op, QueryTypes } from 'sequelize';
import * as cheerio from 'cheerio';
import path = require('path');
import fs from 'fs';
import {
  FileTransferType,
  HitMode,
  NoteDTO,
  PriorityStatistics,
  Repository,
  SearchResult,
  SearchResultOptions,
} from '../../../types';
import {
  Note,
  Tag,
  Asset,
  Description,
  Link,
  Title,
  NotesIndex,
  NoteNotFoundByKeyError,
} from '../DataModels';
import AssetFilesService from '../AssetFilesService';
import moveNote from './operations/MoveNote';
import authenticate from './operations/Authenticate';
import {
  getKeyAndTitlePath,
  getPath,
} from './RepositorySQLiteUtils';
import close from './operations/Close';
import reindexAll from './operations/ReindexAll';
import addNote from './operations/AddNote';
import prepareDescriptionToSave from './operations/PrepareDescriptionToSave';
import addNoteIndex from './operations/AddNoteIndex';
import deleteNoteIndex from './operations/DeleteNoteIndex';
import modifyNote from './operations/ModifyNote';
import updateNoteTitlePath from './operations/UpdateNoteTitlePath';
import isIndexed from './operations/IsIndexed';
import updateNoteKeyPath from './operations/UpdateNoteKeyPath';
import moveNoteToTrash from './operations/MoveNoteToTrash';
import updateTrashFlag from './operations/UpdateTrashFlag';
import restore from './operations/Restore';
import deletePermanently from './operations/DeletePermanently';
import prepareDescriptionToRead from './operations/PrepareDescriptionToRead';
import getNoteWithDescription from './operations/GetNoteWithDescription';
import getBacklinks from './operations/GetBacklinks';

export default class RepositorySQLite implements Repository {
  private sequelize: Sequelize;

  private userName: string;

  private assetFilesService: AssetFilesService;

  constructor(
    assetFilesService: AssetFilesService,
    sequelize: Sequelize,
    userName: string
  ) {
    this.assetFilesService = assetFilesService;
    this.sequelize = sequelize;
    this.userName = userName;
  }

  getSequelize() {
    return this.sequelize;
  }

  getUserName() {
    return this.userName;
  }

  async authenticate() {
    return authenticate(this);
  }

  async close() {
    return close(this);
  }

  async isIndexed(): Promise<boolean> {
    return isIndexed(this);
  }

  async reindexAll(key: string | undefined) {
    return reindexAll(this, key);
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    return addNote(this, parentNoteKey, note, hitMode, relativeToKey);
  }

  async prepareDescriptionToSave(key: string, html: string) {
    return prepareDescriptionToSave(this, key, html);
  }

  async addNoteIndex(note: Note) {
    return addNoteIndex(this, note);
  }

  async deleteNoteIndex(key: string) {
    return deleteNoteIndex(this, key);
  }

  async modifyNote(
    note: NoteDTO,
    skipVersioning: boolean = false
  ): Promise<NoteDTO | undefined> {
    return modifyNote(this, note, skipVersioning);
  }

  async updateNoteTitlePath(
    oldTitlePathParam: string,
    newTitlePathParam: string,
    keyPathParam: string
  ) {
    return updateNoteTitlePath(
      this,
      oldTitlePathParam,
      newTitlePathParam,
      keyPathParam
    );
  }

  async moveNote(
    key: string,
    from: string,
    to: string | undefined,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void> {
    return moveNote(this, key, from, to, hitMode, relativTo);
  }

  async moveNoteToTrash(key: string | undefined): Promise<boolean> {
    return moveNoteToTrash(this, key);
  }

  async restore(key: string | undefined): Promise<boolean> {
    return restore(this, key);
  }

  async deletePermanently(key: string | undefined): Promise<boolean> {
    return deletePermanently(this, key);
  }

  async updateNoteKeyPath(oldKeyPathParam: string, newKeyPathParam: string) {
    return updateNoteKeyPath(this, oldKeyPathParam, newKeyPathParam);
  }

  async updateTrashFlag(key: string, trash: boolean): Promise<void> {
    return updateTrashFlag(this, key, trash);
  }

  async getNoteWithDescription(key: string): Promise<Note | undefined> {
    return getNoteWithDescription(this, key);
  }

  async getBacklinks(key: string): Promise<Array<Note>> {
    return getBacklinks(this, key);
  }


  async getPriorityStatistics(): Promise<PriorityStatistics> {
    const maximum: number = await Note.max('priority', {
      where: { trash: false },
    });
    const minimum: number = await Note.min('priority', {
      where: { trash: false },
    });

    let results = await this.sequelize!.query(
      `SELECT AVG(priority) as average FROM notes`,
      { type: QueryTypes.SELECT }
    );
    const average: number = Math.round(results[0].average);

    results = await this.sequelize!.query(
      `SELECT AVG(priority) as mediana FROM (SELECT priority FROM notes ORDER BY priority LIMIT 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM notes))`,
      { type: QueryTypes.SELECT }
    );
    const mediana: number = Math.round(results[0].mediana);
    log.debug(`RepositorySQLite.getPriorityStatistics() minimum=${minimum}`);
    return {
      minimum,
      average,
      mediana,
      maximum,
    };
  }

  async noteToNoteDTO(
    note: Note,
    withchildren?: boolean,
    withDescription?: boolean,
    withParents?: boolean,
    withLindedNote?: boolean
  ): Promise<NoteDTO> {
    let description: string | null = '';
    if (withDescription && note.description !== undefined) {
      description = note.description;
      /*description = await this.#setInlineImagesPathAfterRead(
        description as string
      );
      description = await this.#setAttachmentsPathAfterRead(description);
      description = await this.#setLinksAfterRead(description);
      */
    }

    let hasChildren: boolean = false;
    if (withchildren) {
      const countChildren: number = await Note.count({
        where: {
          parent: note.key,
        },
      });
      hasChildren = countChildren > 0;
    }

    let parents: NoteDTO[] | undefined = [];
    if (withParents) {
      parents = await this.notesToNoteDTO(
        await this.getParents(note.key, undefined),
        false,
        false,
        false
      );
    }

    const result: NoteDTO = {
      parent: note.parent,
      key: note.key,
      title: note.title,
      type: note.type,
      createdBy: note.createdBy,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      done: note.done,
      priority: note.priority,
      expanded: note.expanded,
      trash: note.trash,
      linkToKey: note.linkToKey,
      description,
      hasChildren,
      parents,
      position: note.position,
    };
    return result;
  }

  async notesToNoteDTO(
    notes: Array<Note> | undefined,
    withchildren?: boolean,
    withDescription?: boolean,
    withParents?: boolean
  ): Promise<Array<NoteDTO> | undefined> {
    if (notes === undefined) {
      return undefined;
    }

    const results = [];
    for (let i: number = 0; i < notes.length; i += 1) {
      results.push(
        this.noteToNoteDTO(notes[i], withchildren, withDescription, withParents)
      );
    }

    return Promise.all(results);
  }

  // SELECT * FROM Notes_index where text MATCH 'a *' and
  //      key in (SELECT key FROM Notes where trash=0)
  //      ORDER BY rank LIMIT 20 OFFSET 0
  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult> {
    let whereNotesIndex = ` `;
    if (searchText && searchText.length > 0 && searchText.trim().length > 0) {
      whereNotesIndex = `${whereNotesIndex} text MATCH :searchText and `;
    }

    let whereNotes = ` `;
    if (options.parentNotesKey && options.parentNotesKey.length) {
      const parentNotesKeyJoined = options.parentNotesKey
        .map((key: string) => ` parents like '%,${key},%' `)
        .join(' or ');
      whereNotes = `${whereNotes} ${parentNotesKeyJoined} and`;
    }
    if (options.types && options.types.length > 0) {
      whereNotes = `${whereNotes} type in (${options.types.join(', ')}) and`;
    }
    if (options.dones && options.dones.length > 0) {
      whereNotes = `${whereNotes} done in (${options.dones.join(', ')}) and`;
    }
    whereNotes = `${whereNotes} trash=${trash ? 1 : 0}`;

    // on Notes_index
    const orderByNotesIndex = ` ORDER BY ${
      options.sortBy ? options.sortBy : 'rank'
    } `;
    let limitNotesIndex = ' ';
    if (limit > -1) {
      limitNotesIndex = ' LIMIT :limit OFFSET :offset ';
    }

    const selectFromNotesIndex = `select * from notes where key in (SELECT key FROM Notes_index where ${whereNotesIndex} key in (SELECT key FROM Notes where ${whereNotes}) ${orderByNotesIndex}) `;
    const selectFromNotesIndexCount = `SELECT count(*) FROM Notes_index where ${whereNotesIndex} key in (SELECT key FROM Notes where ${whereNotes}) `;

    const selectResults: Note[] = await this.sequelize!.query<Note>(
      `${selectFromNotesIndex} ${limitNotesIndex}`,
      {
        replacements: {
          searchText: `${searchText.trim()} *`,
          limit,
          offset: options.offset,
        },
        raw: true,
        type: QueryTypes.SELECT,
      }
    );

    const countResults: any = await this.sequelize!.query(
      `${selectFromNotesIndexCount}`,
      {
        replacements: {
          searchText: `${searchText} *`,
        },
        raw: true,
        type: QueryTypes.SELECT,
      });

    const searchResult: SearchResult = {
      offset: options.offset || 0,
      limit,
      results: selectResults,
      maxResults: countResults[0]['count(*)'],
    };

    return searchResult;
  }

  async addAsset(
    fileType: string | null,
    fileName: string,
    filePathOrBase64: string,
    fileTransferType: FileTransferType
  ): Promise<Asset> {
    const assetModel = await Asset.create({
      type: fileType,
      name: fileName,
      createdBy: this.userName,
    });

    // eslint-disable-next-line no-unused-vars
    const assetFile = this.assetFilesService.saveFile(
      assetModel,
      fileName,
      filePathOrBase64,
      fileTransferType
    );
    return assetModel;
  }

  async getAssetFileReadStream(
    assetKey: string
  ): Promise<fs.ReadStream | undefined> {
    const assetModel: Asset | null = await Asset.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return this.assetFilesService.createReadStream(assetModel);
  }

  async getAssetFileName(assetKey: string): Promise<string | undefined> {
    const assetModel = await Asset.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return assetModel?.name;
  }

  async getAssetFileLocalPath(assetKey: string): Promise<string | undefined> {
    const assetModel = await Asset.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return this.assetFilesService.getAssetFileLocalPath(assetModel);
  }

  async getTags(key: string): Promise<Array<Tag>> {
    return Tag.findAll({
      where: {
        key,
      },
    });
  }

  async addTag(key: string, tag: string): Promise<void> {
    await Tag.findOrCreate({
      where: {
        key,
        tag,
      },
    });
  }

  async removeTag(key: string, tag: string): Promise<string[]> {
    await Tag.destroy({
      where: {
        key,
        tag,
      },
    });

    const tags = await Tag.findAll({
      where: {
        key,
      },
    });

    return tags.map((currentTag) => currentTag.tag);
  }

  async findTag(tag: string): Promise<Tag[]> {
    const tags: Tag[] = await Tag.findAll({
      where: {
        tag: {
          [Op.like]: `${tag}%`,
        },
      },
      group: ['tag'],
    });

    return tags;
  }


  // load root nodes, if key undefined
  // load children notes if key defined
  // TODO: no NtoDTO
  async getChildren(
    key: string | null | undefined,
    trash: boolean = false
  ): Promise<Array<NoteDTO>> {
    log.debug(`RepositorySQLite.getChildren() key=${key}, trash=${trash}`);
    const notes = await Note.findAll({
      where: {
        parent: key === undefined ? null : key,
        trash,
      },
      order: [['position', 'ASC']],
    });

    const withchildren: boolean = true;
    const withDescription: boolean = false;
    const withParents: boolean = false;
    const withLindedNote: boolean = true;

    const resultNotes: Array<NoteDTO> = [];
    for (let i = 0; i < notes.length; i += 1) {
      const noteModel = notes[i];
      // eslint-disable-next-line no-await-in-loop
      const resultNote = await this.noteToNoteDTO(
        noteModel,
        withchildren,
        withDescription,
        withParents,
        withLindedNote
      );
      resultNotes.push(resultNote);
    }
    return resultNotes;
  }

  // TODO: remove when unused any more
  async getParents(
    key: string,
    parents: Array<Note> | undefined
  ): Promise<Array<Note>> {
    let parentLocal: Array<Note> = [];
    if (parents !== undefined) {
      parentLocal = parents;
    }

    const noteModel = await Note.findByPk(key, {
      raw: true,
    });

    if (noteModel === null) {
      throw new NoteNotFoundByKeyError(key);
    }
    if (noteModel.parent === null) {
      parentLocal.unshift(noteModel);
      return parentLocal;
    }
    parentLocal.unshift(noteModel);
    return this.getParents(noteModel.parent, parentLocal);
  }


  async addFile(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined> {
    if (filepath === undefined) {
      return undefined;
    }

    let resultNote;

    const stats = await fs.promises.stat(filepath);
    if (stats.isDirectory()) {
      resultNote = await this.addNote(
        parentKey,
        {
          title: path.basename(filepath),
          type: 'note',
          key: undefined,
          description: undefined,
          createdBy: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          done: undefined,
          priority: undefined,
          expanded: undefined,
          trash: undefined,
          linkToKey: undefined,
          linkedNote: undefined,
          parents: undefined,
          position: undefined,
          tags: undefined,
          hasChildren: undefined,
        },
        hitMode,
        relativeToKey
      );

      const files = await fs.promises.readdir(filepath, {
        withFileTypes: true,
      });

      for (let i = 0; i < files.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await this.addFile(
          resultNote!.key as string,
          path.join(filepath, files[i].name),
          'over',
          resultNote!.key as string
        );
      }
    } else if (stats.isFile()) {
      const asset: Asset = await this.addAsset(
        null,
        path.basename(filepath),
        filepath,
        'path'
      );

      resultNote = await this.addNote(
        parentKey,
        {
          title: path.basename(filepath),
          type: 'note',
          description: `<a href="nn-asset:${
            asset.key
          }" download>${path.basename(filepath)}</a>`,
          key: undefined,
          createdBy: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          done: undefined,
          priority: undefined,
          expanded: undefined,
          trash: undefined,
          linkToKey: undefined,
          linkedNote: undefined,
          parents: undefined,
          position: undefined,
          tags: undefined,
          hasChildren: undefined,
        },
        hitMode,
        relativeToKey
      );
    }
    return resultNote;
  }
}
