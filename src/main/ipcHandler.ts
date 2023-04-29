import log from 'electron-log';
import { app, IpcMain, dialog } from 'electron';
import { RepositoryInfo } from 'main/preload';
import NowNote from './nowNote';
import { SQLITE3_TYPE } from './repository-SQLite';


export default class IpcHandler {
  ipcMain: IpcMain;

  nowNote: NowNote;

  constructor(nowNote: NowNote, ipcMain: IpcMain) {
    this.ipcMain = ipcMain;
    this.nowNote = nowNote;
  }

  init(): void {
    this.ipcMain.handle('app:setDirty', async (event, dirty) => {
      this.nowNote.setDirty(dirty);
    });

    this.ipcMain.handle('app:quit', async () => {
      app.quit();
    });

    this.ipcMain.handle(
      'select-repository-folder',
      async (): Promise<RepositoryInfo> => {
        return new Promise((resolve, reject) => {
        const options = {
          properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
        };

        const choosedFolders = dialog.showOpenDialogSync(options);

        if (choosedFolders) {

          const repositoryFolder = choosedFolders[0];

          this.nowNote
            .getUserSettings()
            .addRepository(
              'NOW Note Repository',
              repositoryFolder,
              SQLITE3_TYPE
            )
            .then(() => {
            this.nowNote.getUserSettings().save().then(() => {
              this.nowNote.getUserSettings().connectRepository(repositoryFolder).then((repository: Repository) => {
                log.debug("repository", repository);
                this.nowNote.setCurrentRepository(repository);
                resolve({
                  name: repository.getName(),
                  directory: repository.getDirectory(),
                  type: repository.getType(),
                  default: repository.isDefault()
                });
              }).catch((error) => {
                resolve({ error: error.message });
              });
                })
                .catch((error) => {
                  resolve({ error: error.message });
                });
            })
            .catch((error) => {
              log.error(error);
              resolve({ error: error.message });
            });
        } else {
          resolve({ error: 'No folder choosed.' });
        }
      });
    });

    this.ipcMain.handle("app:changeRepository", (event, repositoryFolder) => {
      // log.info("app:changeRepository", repositoryFolder);
      return this.nowNote.userSettings.connectRepository(repositoryFolder).then((repository) => {
        this.nowNote.repository = repository;
        return this.nowNote.repository !== undefined;
      });
    });

    this.ipcMain.handle("app:setRepositorySettings", (event, settings) => {
      // log.info("app:setRepositorySettings", settings, this.nowNote.repository);
      if (this.nowNote.repository) {
        this.nowNote.repository.setRepositorySettings(settings);
      } else {
        log.error("Cannot set settings of not opened repository.");
      }
    });

    this.ipcMain.handle("app:getRepositorySettings", (event) => {
      // log.info("app:getRepositorySettings", this.nowNote.repository);
      if (this.nowNote.repository) {
        return this.nowNote.repository.getRepositorySettings();
      } else {
        return false;
      }
    });

    this.ipcMain.handle("app:closeRepository", (event) => {
      // log.info("app:closeRepository");
      if (this.nowNote.repository) {
        return this.nowNote.repository.closeRepository().then(() => {
          // log.info("closeRepository done");
          this.nowNote.repository = undefined;
        });
      }
    });

    this.ipcMain.handle("app:isRepositoryInitialized", (event) => {
      log.debug("app:closeRepository");
      return this.nowNote.repository !== undefined;
    });

    this.ipcMain.handle("app:getRepositories", (event) => {
      if (this.nowNote.userSettings) {
        return this.nowNote.userSettings.getRepositories().then((repositories) => {
          return repositories;
        }).catch((error) => {
          return [];
        });
      }
      return [];
    });

    this.ipcMain.handle("app:getRepository", (event) => {
      return this.nowNote.repository.getRepository(app.getVersion());
    });

    this.ipcMain.handle("store:getChildren", (event, key, trash) => {
      if (this.nowNote.repository) {
        return this.nowNote.repository.getChildren(key, trash);
      }
    });

    this.ipcMain.handle("store:addNote", (event, parentNoteKey, note, hitMode, relativeToKey) => {
      return this.nowNote.repository.addNote(parentNoteKey, note, hitMode, relativeToKey);
    });

    this.ipcMain.handle("store:modifyNote", (event, note) => {
      return this.nowNote.repository.modifyNote(note);
    });

    this.ipcMain.handle("store:addTag", (event, key, tag) => {
      return this.nowNote.repository.addTag(key, tag);
    });

    this.ipcMain.handle("store:removeTag", (event, key, tag) => {
      return this.nowNote.repository.removeTag(key, tag);
    });

    this.ipcMain.handle("store:findTag", (event, tag) => {
      return this.nowNote.repository.findTag(tag);
    });

    this.ipcMain.handle("store:addFile", (event, parentKey, path, hitMode, relativeToKey) => {
      return this.nowNote.repository.addFile(parentKey, path, hitMode, relativeToKey);
    });

    this.ipcMain.handle("store:moveNote", (event, key, from, to, hitMode, relativTo) => {
      // log.debug("store:moveNote", key, from, to, hitMode, relativTo);
      return this.nowNote.repository.moveNote(key, from, to, hitMode, relativTo);
    });

    this.ipcMain.handle("store:moveNoteToTrash", (event, key) => {
      return this.nowNote.repository.moveNoteToTrash(key);
    });

    this.ipcMain.handle("store:restore", (event, key) => {
      return this.nowNote.repository.restore(key);
    });

    this.ipcMain.handle("store:deletePermanently", (event, key) => {
      return this.nowNote.repository.deletePermanently(key);
    });

    this.ipcMain.handle("store:isTrash", (event, key) => {
      return this.nowNote.repository.isTrash(key);
    });

    this.ipcMain.handle("store:getNote", (event, key) => {
      return this.nowNote.repository.getNote(key);
    });

    this.ipcMain.handle("store:getNoteIndex", (event, key) => {
      return this.nowNote.repository.getNoteIndex(key);
    });

    this.ipcMain.handle("store:getParents", (event, key) => {
      return this.nowNote.repository.getParents(key);
    });

    this.ipcMain.handle("store:getBacklinks", (event, key) => {
      return this.nowNote.repository.getBacklinks(key);
    });

    this.ipcMain.handle("app:getPriorityStat", (event) => {
      if (this.nowNote.repository) {
        return this.nowNote.repository.getPriorityStat();
      }
    });

    this.ipcMain.handle("search:search", (event, searchText, limit, trash, options) => {
      return this.nowNote.repository.search(searchText, limit, trash, options);
    });

    this.ipcMain.handle('download-attachment',  (event, url) => {
      log.debug('download-attachment', url);

      let assetKey = url.substring("nn-asset:".length);

      // file:////e:\...
      //let filePath = url.substring(8);
      // let fileName = path.basename(filePath);
      // log.debug('download-attachment fileName', fileName);

      // log.debug('download-attachment filePath', filePath);

      this.nowNote.repository.getAssetFileName(assetKey).then((fileName) => {
        log.debug('download-attachment fileName', fileName);

        let options = {
          //Placeholder 1
          title: "Save file",

          //Placeholder 2
          defaultPath : fileName,


          //Placeholder 4
          buttonLabel : "Save File",
        }

        dialog.showSaveDialog(this.nowNote.mainWindow, options).then((saveObj) => {
          // log.debug("showSaveDialog", saveObj);

          if (!saveObj.canceled && saveObj.filePath) {

            this.nowNote.repository.copyAssetFileToFolder(assetKey, saveObj.filePath).then(() => {
              log.debug("showSaveDialog ready");
            });

    /*
            fs.copyFile(filePath, saveObj.filePath).then(() => {
              // log.debug("showSaveDialog ready");
            });
            */
          }
        });

      });

    });

    log.debug(`ipcMain init() done`);
  }
}
