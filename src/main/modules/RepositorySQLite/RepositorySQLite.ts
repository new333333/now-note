/* eslint-disable class-methods-use-this */
/* eslint max-classes-per-file: ["error", 99] */
import log from 'electron-log';
import { Sequelize } from 'sequelize';
import path = require('path');
import fs from 'fs';
import {
  AssetDTO,
  HitMode,
  MoveToDTO,
  NoteDTO,
  PriorityStatistics,
  SearchResult,
  SearchResultOptions,
  SettingsDTO,
} from '../../../types';
import { NoteModel, AssetModel, RepositoryIntern } from '../DataModels';
import AssetFilesService from '../AssetFilesService';
import moveNote from './operations/MoveNote';
import authenticate from './operations/Authenticate';
import close from './operations/Close';
import reindex from './operations/Reindex';
import getReindexingProgress from './operations/GetReindexingProgress';
import addNote from './operations/AddNote';
import prepareDescriptionToSave from './operations/PrepareDescriptionToSave';
import addNoteIndex from './operations/AddNoteIndex';
import deleteNoteIndex from './operations/DeleteNoteIndex';
import modifyNote from './operations/ModifyNote';
import updateNoteTitlePath from './operations/UpdateNoteTitlePath';
import updateNoteKeyPath from './operations/UpdateNoteKeyPath';
import moveNoteToTrash from './operations/MoveNoteToTrash';
import updateTrashFlag from './operations/UpdateTrashFlag';
import restore from './operations/Restore';
import deletePermanently from './operations/DeletePermanently';
import getNoteWithDescription from './operations/GetNoteWithDescription';
import getBacklinks from './operations/GetBacklinks';
import getPriorityStatistics from './operations/GetPriorityStatistics';
import search from './operations/Search';
import getChildren from './operations/GetChildren';
import getNext from './operations/GetNext';
import getPrevious from './operations/GetPrevious';
import removeTag from './operations/RemoveTag';
import addTag from './operations/AddTag';
import findTag from './operations/FindTag';
import modifySettings from './operations/ModifySettings';
import getSettings from './operations/GetSettings';
import addMoveTo from './operations/AddMoveTo';
import removeMoveTo from './operations/RemoveMoveTo';
import getMoveToList from './operations/GetMoveToList';

export default class RepositorySQLite implements RepositoryIntern {
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

  getSequelize(): Sequelize {
    return this.sequelize;
  }

  getUserName(): string {
    return this.userName;
  }

  async authenticate(): Promise<void> {
    await authenticate(this);
  }

  async close(): Promise<void> {
    return close(this);
  }

  async reindex(key: string | undefined): Promise<void> {
    return reindex(this, key);
  }

  async getReindexingProgress(): Promise<number> {
    return getReindexingProgress(this);
  }

  async addNote(
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    return addNote(this, parentNoteKey, note, hitMode, relativeToKey);
  }

  async prepareDescriptionToSave(key: string, html: string): Promise<string> {
    return prepareDescriptionToSave(this, key, html);
  }

  async addNoteIndex(note: NoteModel): Promise<void> {
    return addNoteIndex(this, note);
  }

  async deleteNoteIndex(key: string): Promise<void> {
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
  ): Promise<void> {
    return updateNoteTitlePath(
      this,
      oldTitlePathParam,
      newTitlePathParam,
      keyPathParam
    );
  }

  async moveNote(
    key: string,
    to: string | undefined,
    hitMode: HitMode
  ): Promise<void> {
    return moveNote(this, key, to, hitMode);
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

  async updateNoteKeyPath(
    oldKeyPathParam: string,
    newKeyPathParam: string
  ): Promise<void> {
    return updateNoteKeyPath(this, oldKeyPathParam, newKeyPathParam);
  }

  async updateTrashFlag(key: string, trash: boolean): Promise<void> {
    return updateTrashFlag(this, key, trash);
  }

  async getNoteWithDescription(
    key: string,
    withoutDescription?: boolean
  ): Promise<NoteDTO | undefined> {
    return getNoteWithDescription(this, key, withoutDescription);
  }

  async getBacklinks(key: string): Promise<Array<NoteDTO>> {
    return getBacklinks(this, key);
  }

  async getPriorityStatistics(): Promise<PriorityStatistics> {
    return getPriorityStatistics(this);
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult> {
    return search(this, searchText, limit, trash, options);
  }

  async getChildren(
    key: string | null | undefined,
    trash?: boolean,
    limit?: number
  ): Promise<Array<NoteDTO>> {
    return getChildren(this, key, trash, limit);
  }

  async getNext(key: string | null | undefined): Promise<NoteDTO> {
    return getNext(this, key);
  }

  async getPrevious(key: string | null | undefined): Promise<NoteDTO> {
    return getPrevious(this, key);
  }

  async addTag(key: string, tag: string): Promise<string> {
    return addTag(this, key, tag);
  }

  async removeTag(key: string, tag: string): Promise<string> {
    return removeTag(this, key, tag);
  }

  async findTag(tag: string): Promise<string[]> {
    return findTag(this, tag);
  }

  async addImageAsBase64(
    fileType: string | null,
    fileName: string,
    base64: string
  ): Promise<AssetDTO> {
    const assetModel = await AssetModel.create({
      type: fileType,
      name: fileName,
      createdBy: this.userName,
    });

    this.assetFilesService.saveBase64ToFile(assetModel, fileName, base64);
    return assetModel.toDTO();
  }

  async addLocalFile(
    fileType: string | null,
    fileName: string,
    filePath: string
  ): Promise<AssetModel> {
    const assetModel = await AssetModel.create({
      type: fileType,
      name: fileName,
      createdBy: this.userName,
    });

    // eslint-disable-next-line no-unused-vars
    const assetFile = await this.assetFilesService.saveLocalFile(
      assetModel,
      fileName,
      filePath
    );
    return assetModel;
  }

  async getAssetFileReadStream(
    assetKey: string
  ): Promise<fs.ReadStream | undefined> {
    const assetModel: AssetModel | null = await AssetModel.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return this.assetFilesService.createReadStream(assetModel);
  }

  async getAssetFileName(assetKey: string): Promise<string | undefined> {
    const assetModel = await AssetModel.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return assetModel?.name;
  }

  async getAssetFileLocalPath(assetKey: string): Promise<string | undefined> {
    const assetModel = await AssetModel.findByPk(assetKey);
    if (assetModel === null) {
      return undefined;
    }
    return this.assetFilesService.getAssetFileLocalPath(assetModel);
  }

  async modifySettings(
    settingsDTO: SettingsDTO
  ): Promise<SettingsDTO | undefined> {
    return modifySettings(this, settingsDTO);
  }

  async getSettings(): Promise<SettingsDTO | undefined> {
    return getSettings(this);
  }

  async addMoveTo(key: string | null): Promise<void | undefined> {
    return addMoveTo(this, key);
  }

  async removeMoveTo(id: number): Promise<void | undefined> {
    return removeMoveTo(this, id);
  }

  async getMoveToList(): Promise<MoveToDTO[] | undefined> {
    return getMoveToList(this);
  }

  async addFileAsNote(
    parentKey: string,
    filepath: string,
    hitMode: HitMode,
    relativeToKey: string
  ): Promise<NoteDTO | undefined> {
    if (filepath === undefined) {
      return undefined;
    }

    let resultNote: NoteDTO | undefined;

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
          position: undefined,
          tags: undefined,
        },
        hitMode,
        relativeToKey
      );

      const files = await fs.promises.readdir(filepath, {
        withFileTypes: true,
      });

      for (let i = 0; i < files.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await this.addFileAsNote(
          resultNote!.key as string,
          path.join(filepath, files[i].name),
          'over',
          resultNote!.key as string
        );
      }
    } else if (stats.isFile()) {
      const asset: AssetModel = await this.addLocalFile(
        null,
        path.basename(filepath),
        filepath
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
          position: undefined,
          tags: undefined,
        },
        hitMode,
        relativeToKey
      );
    }
    return resultNote;
  }
}
