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
  PriorityStatDTO,
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
} from '../DataModels';
import AssetFilesService from '../AssetFilesService';


class NoteNotFoundByKeyError extends Error {
  private key: string;

  constructor(key: string) {
    super(`Note not found by key: ${key}"`);
    this.key = key;
  }
}

export const SQLITE3_TYPE: string = 'sqlite3';

export class RepositorySQLite implements Repository {
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

  async open() {
    await this.sequelize!.authenticate();

    NotesIndex.init(
      {
        key: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
        descriptionAsText: {
          type: DataTypes.TEXT,
          allowNull: true,
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
        trash: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        parents: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        path: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tags: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize: this.sequelize,
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
      },
      {
        sequelize: this.sequelize,
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
        sequelize: this.sequelize,
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
        descriptionAsText: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize: this.sequelize,
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
        sequelize: this.sequelize,
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
        sequelize: this.sequelize,
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
        sequelize: this.sequelize,
      }
    );
  }

  async close() {
    if (this.sequelize !== undefined) {
      this.sequelize?.close();
    }
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult> {
    const select = `SELECT * FROM Notes_index `;
    const selectCount = `SELECT count(*) FROM Notes_index `;

    let where = ` WHERE`;
    if (searchText) {
      where = `${where} (title MATCH :searchText or descriptionAsText MATCH :searchText or path MATCH :searchText) and`;
    }
    if (options.parentNotesKey && options.parentNotesKey.length) {
      const parentNotesKeyJoined = options.parentNotesKey
        .map((key: string) => ` parents like '%,${key},%' `)
        .join(' or ');
      where = `${where} ${parentNotesKeyJoined} and`;
    }
    if (options.types && options.types.length > 0) {
      where = `${where} type in (${options.types.join(', ')}) and`;
    }
    if (options.dones && options.dones.length > 0) {
      where = `${where} done in (${options.dones.join(', ')}) and`;
    }
    where = `${where} trash=${trash ? 1 : 0}`;
    where = `${where} ORDER BY ${options.sortBy ? options.sortBy : 'rank'}`;

    let limitWhere = ' ';
    if (limit > -1) {
      limitWhere = ' LIMIT :limit OFFSET :offset ';
    }

    const selectResults: Note[] = await this.sequelize!.query<Note>(
      select + where + limitWhere,
      {
        replacements: {
          searchText: `${searchText} *`,
          limit,
          offset: options.offset,
        },
        raw: true,
        type: QueryTypes.SELECT,
      }
    );

    const countResults: any = await this.sequelize!.query(selectCount + where, {
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

  async reindexAll() {
    const reindexTree: boolean = true;
    const notePath: string = '';
    const onlyPath: boolean = false;
    const pathKeys: string = '';
    await this.modifyNoteIndex(null, reindexTree, notePath, pathKeys, onlyPath);
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    let parent: string | null = parentNoteKey.startsWith('root_')
      ? null
      : parentNoteKey;
    let { position } = note;

    if (hitMode === 'firstChild') {
      await this.sequelize!.query(
        `UPDATE Notes SET position = position + 1 where ${
          parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash`,
        {
          replacements: {
            parent,
            trash: false,
          },
        }
      );

      position = 0;
    } else if (hitMode === 'over') {
      const max: number = await Note.max('position', {
        where: {
          parent: parentNoteKey,
        },
      });

      position = max == null ? 0 : max + 1;
    } else if (hitMode === 'after') {
      const relativNote: Note | null = await Note.findByPk(relativeToKey);
      if (relativNote === null) {
        throw new NoteNotFoundByKeyError(relativeToKey);
      }

      await this.sequelize!.query(
        `UPDATE Notes SET position = position + 1 where ${
          relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash and position > :position`,
        {
          replacements: {
            parent: relativNote.parent,
            position: relativNote.position,
            trash: false,
          },
          type: QueryTypes.SELECT,
        }
      );

      parent = relativNote.parent;
      position = relativNote.position + 1;
    } else if (hitMode === 'before') {
      const relativNote: Note | null = await Note.findByPk(relativeToKey);
      if (relativNote === null) {
        throw new NoteNotFoundByKeyError(relativeToKey);
      }

      await this.sequelize!.query(
        `UPDATE Notes SET position = position + 1 where ${
          relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash and position >= :position`,
        {
          replacements: {
            parent: relativNote.parent,
            position: relativNote.position,
            trash: false,
          },
          type: QueryTypes.SELECT,
        }
      );

      parent = relativNote.parent;
      position = relativNote.position;
    }

    const createdBy: string = note.createdBy || this.userName;
    const expanded: boolean = note.expanded || false;
    const done: boolean = note.done || false;

    const description = await this.#setInlineImagesBeforeWrite(
      note.description || ''
    );

    const newNote: Note = await Note.create({
      title: note.title,
      description,
      descriptionAsText: '',
      parent,
      position,
      type: note.type,
      createdBy,
      done,
      priority: note.priority,
      expanded,
      trash: false,
      linkToKey: note.linkToKey,
    });

    // now have key, so can save links
    if (newNote.description !== null && newNote.description.length > 0) {
      newNote.description = await this.#setLinksBeforeWrite(
        newNote.key,
        newNote.description
      );
    }
    await newNote.save();
    if (newNote.linkToKey) {
      await Link.create({
        from: newNote.key,
        to: newNote.linkToKey,
        type: 'note',
      });
    }

    log.debug('this.#addNoteIndex(newNote) start');
    await this.#addNoteIndex(newNote);
    log.debug('this.#addNoteIndex(newNote) done');
    const resultNote = await this.noteToNoteDTO(newNote, false, true);
    log.debug('this.noteToNoteDTO(newNote) done');
    return resultNote;
  }

  async #addNoteIndex(newNote: Note) {
    let parents: Note[] | undefined = await this.getParents(
      newNote.key,
      undefined
    );
    if (parents === undefined) {
      parents = [];
    } else {
      parents.pop();
    }
    const $description = cheerio.load(newNote.description || '', null, false);

    const notesPath: string = this.#notesArrayToPath(parents);
    const parentsKeys = this.#notesArrayToKeys(parents);
    await this.sequelize!.query<NotesIndex>(
      'INSERT INTO Notes_index (key, path, parents, title, descriptionAsText, type, done, priority, trash) VALUES (:key, :path, :parents, :title, :descriptionAsText, :type, :done, :priority, :trash)',
      {
        replacements: {
          key: newNote.key,
          path: notesPath || '',
          parents: parentsKeys || '',
          title: newNote.title || '',
          descriptionAsText: $description.text(),
          type: newNote.type,
          done: newNote.done,
          priority: newNote.priority,
          trash: newNote.trash,
        },
        type: QueryTypes.INSERT, // ignore this error, this is the right type
      }
    );
  }

  private async modifyNoteIndex(
    note: Note | null,
    reindexTree: boolean,
    notePath: string,
    notePathKeys: string,
    onlyPath: boolean
  ): Promise<void> {
    if (note !== null) {
      if (!onlyPath) {
        const tags: Tag[] = await Tag.findAll({
          where: {
            key: note.key,
          },
        });

        const tagsAsString = tags.map((tag) => tag.tag).join(' ');
        const $description = cheerio.load(note.description || '', null, false);

        // eslint-disable-next-line camelcase
        await this.sequelize!.query(
          `UPDATE Notes_index set ${
            reindexTree ? 'path = :path, parents = :parents, ' : ''
          } title = :title, descriptionAsText = :descriptionAsText, type = :noteType, done = :done, priority = :priority, trash = :trash, tags = :tags where key = :key`,
          {
            replacements: {
              key: note.key,
              title: note.title || '',
              tags: tagsAsString,
              descriptionAsText: $description.text(),
              noteType: note.type,
              done: note.done,
              priority: note.priority,
              trash: note.trash,
              path: reindexTree ? notePath : null,
              parents: reindexTree ? notePathKeys : null,
            },
            type: QueryTypes.UPDATE,
          }
        );
      } else {
        await this.sequelize!.query(
          `UPDATE Notes_index set ${
            reindexTree ? 'path = :path, parents = :parents, ' : ''
          } title = :title where key = :key`,
          {
            replacements: {
              key: note.key,
              title: note.title || '',
              path: reindexTree ? notePath : null,
              parents: reindexTree ? notePathKeys : null,
            },
          }
        );
      }
    }

    if (reindexTree) {
      let deeperNotePath: string = notePath || '';
      if (note !== null) {
        if (deeperNotePath.length > 0) {
          deeperNotePath += ' / ';
        }
        deeperNotePath += note.title;

        let deeperNotePathKeys = notePathKeys;
        if (deeperNotePathKeys.length === 0) {
          deeperNotePathKeys = ',';
        }
        deeperNotePathKeys += `${note.key},`;
      }

      const children = await Note.findAll({
        where: {
          parent: note ? note.key : null,
        },
      });

      const results = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const child of children) {
        results.push(
          this.modifyNoteIndex(
            child,
            reindexTree,
            deeperNotePath,
            notePathKeys,
            onlyPath
          )
        );
      }
      await Promise.all(results);
    }
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

  async #setInlineImagesBeforeWrite(htmltext: string) {
    try {
      if (htmltext === undefined) {
        return '';
      }
      const $description = cheerio.load(htmltext, null, false);
      const imgs = $description('img');

      for (let i = 0; i < imgs.length; i += 1) {
        const nextImg = imgs.eq(i);
        const imgSrc = nextImg.attr('src');
        if (imgSrc !== undefined) {
          if (nextImg.attr('data-n3asset-key')) {
            // support old repository implementations
            const assetKey = nextImg.attr('data-n3asset-key');
            nextImg.removeAttr('data-n3asset-key');
            nextImg.attr('src', `nn-asset:${assetKey}`);
          } else if (imgSrc.indexOf('data:image/') === 0) {
            // save as asset data:image/png;base64,...
            const fileType = imgSrc.substring(5, 14); // image/png
            const fileName = 'img.png';
            const filePathOrBase64 = imgSrc.substring(22);
            const fileTransferType: FileTransferType = imgSrc.substring(
              15,
              21
            ) as FileTransferType; // base64
            // eslint-disable-next-line no-await-in-loop
            const asset: Asset = await this.addAsset(
              fileType,
              fileName,
              filePathOrBase64,
              fileTransferType
            );
            nextImg.attr('src', `nn-asset:${asset.key}`);
          } else if (imgSrc.indexOf('file:///') === 0) {
            // copy/paste e.g. from outlook
            const filePath = imgSrc.substring('file:///'.length);
            // eslint-disable-next-line no-await-in-loop
            const asset: Asset = await this.addAsset(
              null,
              path.basename(filePath),
              filePath,
              'path'
            );
            nextImg.attr('src', `nn-asset:${asset.key}`);
          } else if (imgSrc.indexOf('file://') === 0) {
            // copy/paste e.g. from outlook
            const filePath = imgSrc.substring('file://'.length);
            // eslint-disable-next-line no-await-in-loop
            const asset: Asset = await this.addAsset(
              null,
              path.basename(filePath),
              filePath,
              'path'
            );
            nextImg.attr('src', `nn-asset:${asset.key}`);
          }
        }
      }
      return $description.html();
    } catch (e) {
      log.error(e);
      return htmltext;
    }
  }

  #notesArrayToPath(notesArray: Note[]): string {
    let notesPath = '';
    let sep = '';
    if (notesArray) {
      notesArray.forEach((parentNote) => {
        notesPath = `${notesPath}${sep}${parentNote.title}`;
        sep = ' / ';
      });
    }
    return notesPath;
  }

  #notesArrayToKeys(notesArray: Note[]): string {
    if (notesArray.length === 0) {
      return '';
    }
    let keys = ',';
    if (notesArray) {
      notesArray.forEach((note) => {
        keys = `${keys}${note.key},`;
      });
    }
    return keys;
  }

  async #setLinksBeforeWrite(
    key: string,
    description: string | undefined | null
  ) {
    let html: string = '';
    if (description !== undefined && description !== null) {
      html = description;
    }

    const $htmlCntainer = cheerio.load(html, null, false);
    const internalLinks = $htmlCntainer('[data-nnlink-node]');

    const newLinks: string[] = [];

    for (let i = 0; i < internalLinks.length; i += 1) {
      const $linkToNote = internalLinks.eq(i);
      const linkToNoteKey: string | undefined =
        $linkToNote.attr('data-nnlink-node');
      if (linkToNoteKey !== undefined) {
        // eslint-disable-next-line no-await-in-loop
        const linkToNote = await Note.findByPk(linkToNoteKey);
        if (linkToNote !== undefined) {
          if (!newLinks.includes(linkToNoteKey)) {
            newLinks.push(linkToNoteKey);
          }
          // eslint-disable-next-line no-await-in-loop
          await Link.findOrCreate({
            where: {
              from: key,
              to: linkToNoteKey,
              type: {
                [Op.or]: {
                  [Op.lt]: 'link',
                  [Op.eq]: null, // support previous implementation
                },
              },
            },
            defaults: {
              from: key,
              to: linkToNoteKey,
              type: 'link',
            },
          });
        }

        // clean goto-links before write
        $linkToNote.html('');
      }
    }

    const allLinks: Link[] = await Link.findAll({
      where: {
        from: key,
        type: {
          [Op.or]: {
            [Op.lt]: 'link',
            [Op.eq]: null, // support previous implementation
          },
        },
      },
    });

    for (let i = 0; i < allLinks.length; i += 1) {
      const link = allLinks[i];
      // eslint-disable-next-line no-await-in-loop
      const linkToNote = await Note.findByPk(link.to);
      if (linkToNote !== undefined) {
        if (!newLinks.includes(link.to)) {
          // eslint-disable-next-line no-await-in-loop
          await link.destroy();
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        await link.destroy();
      }
    }

    return $htmlCntainer.html();
  }

  async modifyNote(
    note: NoteDTO,
    skipVersioning: boolean = false
  ): Promise<NoteDTO | undefined> {
    const modifyNote = await Note.findByPk(note.key);
    if (modifyNote === null) {
      throw new NoteNotFoundByKeyError(note.key);
    }

    let reindex = false;
    let reindexTree = false;
    if (note.title !== undefined) {
      if (!skipVersioning) {
        await Title.create({
          key: modifyNote.key,
          title: modifyNote.title,
        });
      }
      if (modifyNote.title !== note.title) {
        reindexTree = true;
      }
      modifyNote.title = note.title;
    }
    if (note.description !== undefined) {
      let html: string = note.description;
      html = await this.#setLinksBeforeWrite(note.key, html);
      html = await this.#setInlineImagesBeforeWrite(html);

      if (!skipVersioning) {
        await Description.create({
          key: modifyNote.key,
          description:
            modifyNote.description !== null ? modifyNote.description : '',
          descriptionAsText: modifyNote.descriptionAsText,
        });
      }
      modifyNote.description = html;

      const $description = cheerio.load(html, null, false);
      modifyNote.descriptionAsText = $description.text();
      reindex = true;
    }
    if (note.type !== undefined) {
      modifyNote.type = note.type;
      reindex = true;
    }
    if (note.done !== undefined) {
      modifyNote.done = note.done;
      reindex = true;
    }
    if (note.priority !== undefined) {
      modifyNote.priority = note.priority;
      reindex = true;
    }
    if (note.expanded !== undefined) {
      modifyNote.expanded = note.expanded;
    }
    await modifyNote.save();

    if (reindex || reindexTree) {
      const parents = await this.getParents(modifyNote.key, undefined);
      parents.pop();
      const reindexOnlyPath = reindexTree && !reindex;
      await this.modifyNoteIndex(
        modifyNote,
        reindexTree,
        reindexTree ? this.#notesArrayToPath(parents) : '',
        reindexTree ? this.#notesArrayToKeys(parents) : '',
        reindexOnlyPath
      );
    }

    return this.noteToNoteDTO(modifyNote, false, true);
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
  async getChildren(
    key: string | undefined,
    trash: boolean = false
  ): Promise<Array<NoteDTO>> {
    // log.info('getChildren, key, trash', key, trash);
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

  async moveNote(
    key: string,
    from: string,
    to: string | undefined,
    hitMode: HitMode,
    relativTo: string
  ): Promise<void> {
    let toLocal: string | null = null;
    if (to !== undefined) {
      toLocal = to;
    }

    const modifyNote = await Note.findByPk(key);
    if (modifyNote === null) {
      throw new NoteNotFoundByKeyError(key);
    }

    // count parent and position
    if (hitMode === 'over') {
      await this.sequelize!.query(
        `UPDATE Notes SET position = position - 1 where ${
          modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash and position > :position`,
        {
          replacements: {
            parent: modifyNote.parent,
            position: modifyNote.position,
            trash: false,
          },
          type: QueryTypes.SELECT,
        }
      );

      modifyNote.parent = toLocal;
      const max: number = await Note.max('position', {
        where: {
          parent: toLocal,
          trash: false,
        },
      });

      modifyNote.position = max == null ? 0 : max + 1;
    } else if (hitMode === 'before') {
      const relativNote = await Note.findByPk(relativTo);
      if (relativNote === null) {
        throw new NoteNotFoundByKeyError(relativTo);
      }

      if (modifyNote.parent === relativNote.parent) {
        await this.sequelize!.query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: modifyNote.parent,
              position: modifyNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        await relativNote.reload();

        await this.sequelize!.query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position >= :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        modifyNote.parent = relativNote.parent;
        modifyNote.position = relativNote.position;
      } else {
        await this.sequelize!.query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: modifyNote.parent,
              position: modifyNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        await this.sequelize!.query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position >= :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        modifyNote.parent = relativNote.parent;
        modifyNote.position = relativNote.position;
      }
    } else if (hitMode === 'after') {
      const relativNote = await Note.findByPk(relativTo);
      if (relativNote === null) {
        throw new NoteNotFoundByKeyError(relativTo);
      }

      if (modifyNote.parent === relativNote.parent) {
        await this.sequelize!.query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: modifyNote.parent,
              position: modifyNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        await relativNote.reload();

        await this.sequelize!.query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        modifyNote.position += 1;
      } else {
        await this.sequelize!.query(
          `UPDATE Notes SET position = position - 1 where ${
            modifyNote.parent === null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: modifyNote.parent,
              position: modifyNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        await this.sequelize!.query(
          `UPDATE Notes SET position = position + 1 where ${
            relativNote.parent === null ? 'parent is NULL ' : 'parent = :parent'
          } and trash = :trash and position > :position`,
          {
            replacements: {
              parent: relativNote.parent,
              position: relativNote.position,
              trash: false,
            },
            type: QueryTypes.SELECT,
          }
        );

        modifyNote.parent = relativNote.parent;
        modifyNote.position = relativNote.position + 1;
      }
    }

    modifyNote.save();

    const reindexTree = true;
    const onlyPath = true;
    const parents = await this.getParents(modifyNote.key, undefined);
    parents.pop();
    await this.modifyNoteIndex(
      modifyNote,
      reindexTree,
      this.#notesArrayToPath(parents),
      this.#notesArrayToKeys(parents),
      onlyPath
    );
  }

  async moveNoteToTrash(key: string | undefined): Promise<boolean> {
    if (key === undefined) {
      return false;
    }

    const modifyNote = await Note.findByPk(key);
    if (modifyNote === null) {
      throw new NoteNotFoundByKeyError(key);
    }

    await this.sequelize!.query(
      `UPDATE Notes SET position = position - 1 where ${
        modifyNote.parent === null ? 'parent is NULL' : 'parent = :parent'
      } and trash = :trash and position > :position`,
      {
        replacements: {
          parent: modifyNote.parent,
          position: modifyNote.position,
          trash: false,
        },
        type: QueryTypes.SELECT,
      }
    );

    const max: number = await Note.max('position', {
      where: {
        parent: null,
        trash: true,
      },
    });

    modifyNote.restoreParentKey = modifyNote.parent;
    modifyNote.parent = null;
    modifyNote.position = max === null ? 0 : max + 1;
    modifyNote.trash = true;
    modifyNote.save();

    const trash = true;
    await this.#modifyTrashFlag(key, trash);

    const reindexTree = true;
    const onlyPath = false;
    const parents = await this.getParents(modifyNote.key, undefined);
    parents.pop();
    await this.modifyNoteIndex(
      modifyNote,
      reindexTree,
      this.#notesArrayToPath(parents),
      this.#notesArrayToKeys(parents),
      onlyPath
    );
    return true;
  }

  async restore(key: string | undefined): Promise<boolean> {
    if (key === undefined) {
      return false;
    }

    const modifyNote = await Note.findByPk(key);
    if (modifyNote === null) {
      throw new NoteNotFoundByKeyError(key);
    }

    await this.sequelize!.query(
      `UPDATE Notes SET position = position - 1 where ${
        modifyNote.parent == null ? 'parent is NULL' : 'parent = :parent'
      } and trash = :trash and position > :position`,
      {
        replacements: {
          parent: modifyNote.parent,
          position: modifyNote.position,
          trash: true,
        },
        type: QueryTypes.SELECT,
      }
    );

    const max: number = await Note.max('position', {
      where: {
        parent: modifyNote.parent,
        trash: false,
      },
    });
    modifyNote.position = max == null ? 0 : max + 1;

    modifyNote.parent = modifyNote.restoreParentKey;
    modifyNote.restoreParentKey = null;
    modifyNote.trash = false;
    modifyNote.save();

    const trash: boolean = false;
    await this.#modifyTrashFlag(key, trash);

    const reindexTree = true;
    const onlyPath = false;
    const parents = await this.getParents(modifyNote.key, undefined);
    parents.pop();
    await this.modifyNoteIndex(
      modifyNote,
      reindexTree,
      this.#notesArrayToPath(parents),
      this.#notesArrayToKeys(parents),
      onlyPath
    );
    return true;
  }

  async deletePermanently(
    key: string | undefined,
    skipUpdatePosition?: boolean
  ): Promise<boolean> {
    if (key === undefined) {
      return false;
    }

    const deleteNote = await Note.findByPk(key);
    if (deleteNote === null) {
      throw new NoteNotFoundByKeyError(key);
    }

    const children = await Note.findAll({
      where: {
        parent: key,
        trash: true,
      },
    });

    for (let i = 0; i < children.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.deletePermanently(children[i].key, true);
    }

    if (!skipUpdatePosition) {
      await this.sequelize!.query(
        `UPDATE Notes SET position = position - 1 where ${
          deleteNote.parent == null ? 'parent is NULL' : 'parent = :parent'
        } and trash = :trash and position > :position`,
        {
          replacements: {
            parent: deleteNote.parent,
            position: deleteNote.position,
            trash: true,
          },
          type: QueryTypes.SELECT,
        }
      );
    }

    await this.sequelize!.query(
      'DELETE FROM Notes_index where key = :key and trash = :trash',
      {
        replacements: {
          key,
          trash: true,
        },
      }
    );

    await Description.destroy({
      where: {
        key,
      },
    });

    await Link.destroy({
      where: {
        from: key,
        type: {
          [Op.or]: {
            [Op.lt]: 'link',
            [Op.eq]: null,
          },
        },
      },
    });

    await Tag.destroy({
      where: {
        key,
      },
    });

    await Title.destroy({
      where: {
        key,
      },
    });

    deleteNote.destroy();
    return true;
  }

  async #modifyTrashFlag(key: string, trash: boolean): Promise<void> {
    await Note.update(
      {
        trash,
      },
      {
        where: {
          parent: key,
        },
      }
    );

    const children = await Note.findAll({
      where: {
        parent: key,
      },
    });

    for (let i = 0; i < children.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.#modifyTrashFlag(children[i].key, trash);
    }
  }

  async getNote(key: string): Promise<NoteDTO | undefined> {
    const withchildren: boolean = false;
    const withDescription: boolean = true;
    const withParents: boolean = false;
    const withLindedNote: boolean = true;

    return this.getNoteWith(
      key,
      withchildren,
      withDescription,
      withParents,
      withLindedNote
    );
  }

  async getNoteWith(
    key: string | undefined,
    withchildren: boolean,
    withDescription: boolean,
    withParents: boolean,
    withLindedNote: boolean
  ): Promise<NoteDTO | undefined> {
    if (key === undefined) {
      return undefined;
    }

    const noteModel = await Note.findByPk(key);
    if (noteModel === null) {
      return undefined;
    }

    return this.noteToNoteDTO(
      noteModel,
      withchildren,
      withDescription,
      withParents,
      withLindedNote
    );
  }

  async getBacklinks(key: string): Promise<Array<NoteDTO>> {
    const links = await Link.findAll({
      where: {
        to: key,
      },
    });

    const backlinks: Array<NoteDTO> = [];

    const withchildren: boolean = false;
    const withDescription: boolean = false;
    const withParents: boolean = true;
    const withLindedNote: boolean = true;

    for (let i = 0; i < links.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const note = await this.getNoteWith(
        links[i].from,
        withchildren,
        withDescription,
        withParents,
        withLindedNote
      );

      if (note !== undefined) {
        backlinks.push(note);
      }
    }

    return backlinks;
  }

  async getTags(key: string): Promise<Array<Tag>> {
    return Tag.findAll({
      where: {
        key,
      },
    });
  }

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

  // support old repository implementations
  async #setInlineImagesPathAfterRead(
    html: string | undefined
  ): Promise<string> {
    if (html === undefined) {
      return '';
    }
    const $html = cheerio.load(html, null, false);
    const imgs = $html('img');

    for (let i = 0; i < imgs.length; i += 1) {
      const nextImg = imgs.eq(i);
      if (nextImg.attr('data-n3asset-key') !== undefined) {
        const assetKey = nextImg.attr('data-n3asset-key');
        nextImg.attr('src', `nn-asset:${assetKey}`);
        nextImg.removeAttr('data-n3asset-key');
      }
    }

    return $html.html();
  }

  async #setLinksAfterRead(htmlText: string): Promise<string> {
    if (htmlText === undefined) {
      return '';
    }

    const $htmlCntainer = cheerio.load(htmlText, null, false);
    const internalLinks = $htmlCntainer('[data-nnlink-node]');

    for (let i = 0; i < internalLinks.length; i += 1) {
      const $linkToNote = internalLinks.eq(i);
      if ($linkToNote.attr('data-nnlink-node')) {
        const linkToNoteKey = $linkToNote.attr('data-nnlink-node');
        // eslint-disable-next-line no-await-in-loop
        const note = await Note.findByPk(linkToNoteKey);
        if (note) {
          // eslint-disable-next-line no-await-in-loop
          const parents = await this.getParents(note.key, undefined);

          let notePath = '';
          let sep = '';
          if (parents) {
            parents.forEach((parentNote) => {
              notePath = `${notePath}${sep}${
                parentNote.trash ? ' in Trash: ' : ''
              }<a href='#${parentNote.key}' data-goto-note='${
                parentNote.key
              }'>${parentNote.title}</a>`;
              sep = ' / ';
            });
          }

          $linkToNote.html(`<span class="nn-link">#${notePath}</span>`);
        } else {
          $linkToNote.html(
            `<span class="nn-link nn-link-to-missing-note">#NODE ${linkToNoteKey} NOT FOUND</span>`
          );
        }
      }
    }

    return $htmlCntainer.html();
  }

  async #setAttachmentsPathAfterRead(htmltext: string): Promise<string> {
    if (htmltext === undefined) {
      return '';
    }
    // support old repository implementation
    const $linksHiddenContainer = cheerio.load(htmltext, null, false);
    const links = $linksHiddenContainer('a[data-n3asset-key]');

    for (let i = 0; i < links.length; i += 1) {
      const nextLinks = links.eq(i);
      if (nextLinks.attr('data-n3asset-key') !== undefined) {
        const assetKey = nextLinks.attr('data-n3asset-key');

        nextLinks.attr('href', `nn-asset:${assetKey}`);
        nextLinks.removeAttr('data-n3asset-key');
      }
    }

    return $linksHiddenContainer.html();
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


  async getPriorityStat(): Promise<PriorityStatDTO> {
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
      description = await this.#setInlineImagesPathAfterRead(
        description as string
      );
      description = await this.#setAttachmentsPathAfterRead(description);
      description = await this.#setLinksAfterRead(description);
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
}
