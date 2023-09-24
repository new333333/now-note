import log from 'electron-log';
import { app, IpcMain, dialog, BrowserWindow, shell } from 'electron';
import NowNote from './modules/NowNote';
import {
  UserSettingsRepository,
  Error,
  HitMode,
  NoteDTO,
  PriorityStatistics,
  SearchResult,
  SearchResultOptions,
  RepositorySettings,
  AssetDTO,
} from '../types';
import { AssetModel } from './modules/DataModels';

export default class IpcHandler {
  private browserWindow: BrowserWindow;

  private ipcMain: IpcMain;

  private nowNote: NowNote;

  constructor(
    browserWindow: BrowserWindow,
    nowNote: NowNote,
    ipcMain: IpcMain
  ) {
    this.browserWindow = browserWindow;
    this.ipcMain = ipcMain;
    this.nowNote = nowNote;

    this.ipcMain.handle('quit', async () => {
      log.debug('IpcHandler.quit()');
      app.quit();
    });

    this.ipcMain.handle(
      'selectRepositoryFolder',
      async (): Promise<UserSettingsRepository | Error | undefined> => {
        const options = {
          properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
        };

        const choosedFolders = dialog.showOpenDialogSync(options);
        log.debug('selectRepositoryFolder -> choosedFolders', choosedFolders);
        if (choosedFolders === undefined) {
          return {
            message: 'No folder selected.',
          };
        }

        const repositoryFolder = choosedFolders[0];
        const userSettingsRepository: UserSettingsRepository | undefined =
          await this.nowNote.addRepository(repositoryFolder);
        if (userSettingsRepository === undefined) {
          return {
            message: 'No folder selected.',
          };
        }
        await this.nowNote.setDefaultRepository(repositoryFolder);
        const repository: UserSettingsRepository =
          await this.nowNote.connectRepository(userSettingsRepository);

        return repository;
      }
    );

    this.ipcMain.handle(
      'isRepositoryInitialized',
      async (): Promise<Boolean> => {
        return this.nowNote.isRepositoryInitialized();
      }
    );

    this.ipcMain.handle(
      'getRepositories',
      async (): Promise<Array<UserSettingsRepository> | undefined> => {
        return this.nowNote.getRepositories();
      }
    );

    this.ipcMain.handle(
      'getRepositorySettings',
      async (): Promise<RepositorySettings | undefined> => {
        return this.nowNote.getRepositorySettings();
      }
    );

    this.ipcMain.handle(
      'setRepositorySettings',
      async (_event, settings: RepositorySettings): Promise<void> => {
        this.nowNote.setRepositorySettings(settings);
      }
    );

    this.ipcMain.handle(
      'getCurrentRepository',
      async (): Promise<UserSettingsRepository | undefined> => {
        return this.nowNote.getCurrentRepository();
      }
    );

    this.ipcMain.handle(
      'connectRepository',
      async (
        _event,
        repositoryFolder: string
      ): Promise<UserSettingsRepository | undefined> => {
        let userSettingsRepository: UserSettingsRepository | undefined =
          await this.nowNote.getRepository(repositoryFolder);
        if (userSettingsRepository !== undefined) {
          userSettingsRepository = await this.nowNote.connectRepository(
            userSettingsRepository
          );
        }
        return userSettingsRepository;
      }
    );

    this.ipcMain.handle('closeRepository', async (): Promise<void> => {
      return this.nowNote.closeRepository();
    });

    this.ipcMain.handle(
      'getChildren',
      async (_event, key, trash): Promise<Array<NoteDTO> | undefined> => {
        return this.nowNote.getChildren(key, trash);
      }
    );

    this.ipcMain.handle(
      'getNoteWithDescription',
      async (
        _event,
        key: string,
        withoutDescription?: boolean
      ): Promise<NoteDTO | undefined> => {
        return this.nowNote.getNoteWithDescription(key, withoutDescription);
      }
    );

    this.ipcMain.handle(
      'getBacklinks',
      async (_event, key: string): Promise<Array<NoteDTO> | undefined> => {
        return this.nowNote.getBacklinks(key);
      }
    );

    this.ipcMain.handle(
      'search',
      async (
        _event,
        searchText: string,
        limit: number,
        trash: boolean,
        options: SearchResultOptions
      ): Promise<SearchResult | undefined> => {
        return this.nowNote.search(searchText, limit, trash, options);
      }
    );

    this.ipcMain.handle(
      'modifyNote',
      async (_event, note: NoteDTO): Promise<NoteDTO | undefined> => {
        return this.nowNote.modifyNote(note);
      }
    );

    this.ipcMain.handle(
      'findTag',
      async (_event, tag: string): Promise<string[] | undefined> => {
        return this.nowNote.findTag(tag);
      }
    );

    this.ipcMain.handle(
      'addImageAsBase64',
      async (
        _event,
        fileType: string | null,
        fileName: string,
        base64: string
      ): Promise<AssetDTO | undefined> => {
        return this.nowNote.addImageAsBase64(fileType, fileName, base64);
      }
    );

    this.ipcMain.handle(
      'addTag',
      async (_event, key: string, tag: string): Promise<string | undefined> => {
        return this.nowNote.addTag(key, tag);
      }
    );

    this.ipcMain.handle(
      'removeTag',
      async (_event, key: string, tag: string): Promise<string | undefined> => {
        return this.nowNote.removeTag(key, tag);
      }
    );

    this.ipcMain.handle(
      'addNote',
      async (
        _event,
        parentNoteKey: string,
        note: NoteDTO,
        hitMode: HitMode,
        relativeToKey?: string
      ): Promise<NoteDTO | undefined> => {
        return this.nowNote.addNote(
          parentNoteKey,
          note,
          hitMode,
          relativeToKey
        );
      }
    );

    this.ipcMain.handle(
      'moveNote',
      async (
        _event,
        key: string,
        from: string,
        to: string,
        hitMode: HitMode,
        relativTo: string
      ): Promise<void> => {
        return this.nowNote.moveNote(key, from, to, hitMode, relativTo);
      }
    );

    this.ipcMain.handle(
      'moveNoteToTrash',
      async (_event, key: string): Promise<boolean | undefined> => {
        return this.nowNote.moveNoteToTrash(key);
      }
    );

    this.ipcMain.handle(
      'restore',
      async (_event, key: string): Promise<boolean | undefined> => {
        return this.nowNote.restore(key);
      }
    );

    this.ipcMain.handle(
      'deletePermanently',
      async (_event, key: string): Promise<boolean | undefined> => {
        return this.nowNote.deletePermanently(key);
      }
    );

    this.ipcMain.handle(
      'getPriorityStatistics',
      async (): Promise<PriorityStatistics | undefined> => {
        return this.nowNote.getPriorityStatistics();
      }
    );

    this.ipcMain.handle(
      'addFileAsNote',
      async (
        _event,
        parentKey: string,
        path: string,
        hitMode: HitMode,
        relativeToKey: string
      ): Promise<NoteDTO | undefined> => {
        return this.nowNote.addFileAsNote(parentKey, path, hitMode, relativeToKey);
      }
    );

    this.ipcMain.handle(
      'openAssetFile',
      async (_event, url: string): Promise<string | undefined> => {
        const assetKey = url.substring('nn-asset:'.length);
        const assetFileLocalPath = await this.nowNote.getAssetFileLocalPath(
          assetKey
        );
        if (assetFileLocalPath !== undefined) {
          const openPathStatus = shell.openPath(assetFileLocalPath);
          return Promise.resolve(openPathStatus);
        }
        return Promise.resolve(undefined);
      }
    );

    this.ipcMain.handle(
      'reindexAll',
      async (_event, key: string | undefined): Promise<void> => {
        return this.nowNote.reindexAll(key);
      }
    );

  }
}
