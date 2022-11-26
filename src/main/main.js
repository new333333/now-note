const log = require('electron-log');
const {app, BrowserWindow, ipcMain, dialog, Menu, MenuItem} = require('electron')
// include the Node.js 'path' module at the top of your file
const path = require('path');
const { title } = require('process');
const fs = require('fs').promises;
const nnUserSettings = require('./now-note/user-settings');
const nnRepositoryFactory = require('./now-note/repository-factory');
const os = require ('os');


try {
  require('electron-reloader')(module)
} catch (_) {}

// log.info("Start NOW-Note app...");


const createWindow = () => {
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      }
    });

    
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    return mainWindow;
  }

  const template = [
    {
      label: "Choose Repository Folder",
      click: () => {
        n3.mainWindow.webContents.send('changeRepository')
      }
    },
  /*  {
      label: "Import TODO",
      click: () => {

        let choosedFolders = dialog.showOpenDialogSync({
          properties: [
            "openDirectory",
            "createDirectory",
            "promptToCreate"
          ]
        });
        if (choosedFolders) {
          let importFolder = choosedFolders[0];

          n3.repository.import(importFolder).then(function() {
            log.debug("import done.");
          });

        } else {
          log.info("No repository choosed");
        }

        

      }
    },
    {
      label: "Search",
      submenu: [
        {
          label: 'Reindex All',
          click: () => {
            n3.repository.reindexAll().then(function() {
                log.debug("Reindexing done.");
            });
          }
        }
      ]
    },
    {
       label: 'Edit',
       submenu: [
          {
             role: 'undo'
          },
          {
             role: 'redo'
          },
          {
             type: 'separator'
          },
          {
             role: 'cut'
          },
          {
             role: 'copy'
          },
          {
             role: 'paste'
          }
       ]
    },
    */
    {
       label: 'View',
       submenu: [
          {
             role: 'reload'
          },
          {
             role: 'toggledevtools'
          },
          {
             type: 'separator'
          },
          {
             role: 'resetzoom'
          },
          {
             role: 'zoomin'
          },
          {
             role: 'zoomout'
          },
          {
             type: 'separator'
          },
          {
             role: 'togglefullscreen'
          }
       ]
    },
    /*
    {
       role: 'window',
       submenu: [
          {
             role: 'minimize'
          },
          {
             role: 'close'
          }
       ]
    },
    {
       role: 'help',
       submenu: [
          {
             label: 'Learn More'
          }
       ]
    }
    */
 ]
  


let n3 = {};

app.whenReady().then(() => {

  let userDataPath = app.getPath("userData");
  const username = os.userInfo().username;
  n3.userSettings = new nnUserSettings.UserSettings(userDataPath, os.userInfo().username);

  openDefaultRepo(userDataPath, n3).then(function() {

    log.debug("Start with default repository: ", n3.repository);

    let mainWindow = createWindow();

    log.debug("mainWindow=", mainWindow);
  
    n3.mainWindow = mainWindow;
  
    const menu = Menu.buildFromTemplate(template)
    // Menu.setApplicationMenu(menu)
    mainWindow.setMenu(menu);

    log.debug("Menu ready");
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
  
    log.debug("initIpcMainHandle now");
    initIpcMainHandle(ipcMain);

    log.debug("initIpcMainHandle ready");
  });



});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});



function openDefaultRepo(userDataPath, n3) {
  return new Promise(function(resolve, reject) {

    // n3.userSettings = new nnUserSettings.UserSettings(userDataPath);
    log.info("initNowNoteApplication", userDataPath, n3);
    n3.userSettings.connectDefaultRepository().then(function(repository) {
      if (repository) {
        n3.repository = repository;
      }

      resolve();
    });

  });  
}

function initIpcMainHandle(ipcMain) {

  log.debug("initIpcMainHandle start...");
  ipcMain.handle("app:chooseRepositoryFolder", function() {

    return new Promise(function(resolve, err) {
      let options = {
        properties: [
          "openDirectory",
          "createDirectory",
          "promptToCreate"
        ]
      }

      let choosedFolders = dialog.showOpenDialogSync(options);
      log.debug("showOpenDialogSync", choosedFolders);

      if (choosedFolders) {

        let repositoryFolder = choosedFolders[0];
        log.debug("showOpenDialogSync path", repositoryFolder);

        n3.userSettings.addRepository("NOW NOte Repository", repositoryFolder, nnRepositoryFactory.SQLITE3_TYPE).then(function() {
          n3.userSettings.save().then(function() {
            log.debug("Default user settings saved.");
            n3.userSettings.connectRepository(repositoryFolder).then(function(repository) {
              n3.repository = repository;
              resolve(true);
            });
          }).catch(function(error) {
            log.error(error);
            resolve(false);
          });
        });

      } else {
        resolve(false);
      }

    });    
  });

  ipcMain.handle("app:changeRepository", function(event, repositoryFolder) {
    // log.info("app:changeRepository", repositoryFolder);
    return n3.userSettings.connectRepository(repositoryFolder).then(function(repository) {
      n3.repository = repository;
      return n3.repository !== undefined;
    });
  });

  ipcMain.handle("app:setRepositorySettings", function(event, settings) {
    // log.info("app:setRepositorySettings", settings, n3.repository);
    if (n3.repository) {
      n3.repository.setRepositorySettings(settings);
    } else {
      log.error("Cannot set settings of not opened repository.");
    }
  });

  ipcMain.handle("app:getRepositorySettings", function(event) {
    // log.info("app:getRepositorySettings", n3.repository);
    if (n3.repository) {
      return n3.repository.getRepositorySettings();
    } else {
      return false;
    }
  });

  ipcMain.handle("app:closeRepository", function(event) {
    // log.info("app:closeRepository");
    if (n3.repository) {
      return n3.repository.closeRepository().then(function() {
        log.info("closeRepository done");
        n3.repository = undefined;
      });
    }
  });

  ipcMain.handle("app:isRepositoryInitialized", function() {
    return n3.repository !== undefined;
  });

  ipcMain.handle("app:getUserSettings", function() {
    return n3.userSettings;
  });

  ipcMain.handle("app:getRepositories", function() {
    if (n3.userSettings) {
      return n3.userSettings.getRepositories().then(function(repositories) {
        return repositories;
      }).catch(function(error) {
        return [];
      });
    }
    return [];
  });

  ipcMain.handle("app:getRepository", function() {
    return n3.repository.getRepository(app.getVersion());
  });

  ipcMain.handle("app:shutdown", function() {
    log.info("Want to shutdown NOW-Note app - close storage first");
    return n3.repository.closeRepository().then(function() {
      log.info("Shutdown NOW-Note app...");
      mainWindow.destroy();
      return Promise.resolve();
    });
  });
  
  ipcMain.handle("store:getChildren", function(event, key, trash) {
    if (n3.repository) {
      return n3.repository.getChildren(key, trash);
    }
  });

  ipcMain.handle("store:addNote", function(event, parentNoteKey, note, hitMode, relativeToKey) {
    return n3.repository.addNote(parentNoteKey, note, hitMode, relativeToKey);
  });

  ipcMain.handle("store:modifyNote", function(event, note) {
    return n3.repository.modifyNote(note);
  });

  ipcMain.handle("store:addTag", function(event, key, tag) {
    return n3.repository.addTag(key, tag);
  });

  ipcMain.handle("store:removeTag", function(event, key, tag) {
    return n3.repository.removeTag(key, tag);
  });

  ipcMain.handle("store:findTag", function(event, tag) {
    return n3.repository.findTag(tag);
  });

  // ipcMain.handle("store:addAsset", function(event, fileType, fileName, filePathOrBase64, fileTransferType) {
  //   return n3.repository.addAsset(fileType, fileName, filePathOrBase64, fileTransferType);
  // });

  ipcMain.handle("store:addFile", function(event, parentKey, path, hitMode, relativeToKey) {
    return n3.repository.addFile(parentKey, path, hitMode, relativeToKey);
  });

  ipcMain.handle("store:moveNote", function(event, key, from, to, hitMode, relativTo) {
    log.debug("store:moveNote", key, from, to, hitMode, relativTo);
    return n3.repository.moveNote(key, from, to, hitMode, relativTo);
  });

  ipcMain.handle("store:moveNoteToTrash", function(event, key) {
    return n3.repository.moveNoteToTrash(key);
  });

  ipcMain.handle("store:restore", function(event, key) {
    return n3.repository.restore(key);
  });

  ipcMain.handle("store:deletePermanently", function(event, key) {
    return n3.repository.deletePermanently(key);
  });

  ipcMain.handle("store:isTrash", function(event, key) {
    return n3.repository.isTrash(key);
  });

  ipcMain.handle("store:getNote", function(event, key) {
    return n3.repository.getNote(key);
  });

  ipcMain.handle("store:getNoteIndex", function(event, key) {
    return n3.repository.getNoteIndex(key);
  });

  ipcMain.handle("store:getParents", function(event, key) {
    return n3.repository.getParents(key);
  });

  ipcMain.handle("store:getBacklinks", function(event, key) {
    return n3.repository.getBacklinks(key);
  });

  ipcMain.handle("app:getPriorityStat", function(event) {
    if (n3.repository) {
      return n3.repository.getPriorityStat();
    }
  });

  ipcMain.handle("search:search", function(event, searchText, limit, trash, options) {
    return n3.repository.search(searchText, limit, trash, options);
  });

  ipcMain.handle('download-attachment',  function(event, url) {
    log.debug('download-attachment', url);  

    // file:////e:\...
    let filePath = url.substring(8);
    let fileName = path.basename(filePath);
    log.debug('download-attachment fileName', fileName);  

    log.debug('download-attachment filePath', filePath);  

    let options = {
      //Placeholder 1
      title: "Save file",

      //Placeholder 2
      defaultPath : fileName,


      //Placeholder 4
      buttonLabel : "Save File",
    }

    dialog.showSaveDialog(mainWindow, options).then(function(saveObj) {
      log.debug("showSaveDialog", saveObj);

      if (!saveObj.canceled && saveObj.filePath) {
        fs.copyFile(filePath, saveObj.filePath).then(function() {
          log.debug("showSaveDialog ready");
        });
      }
    });

  });

  log.debug("initIpcMainHandle end...");

}
