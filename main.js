const log = require('electron-log');
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
// include the Node.js 'path' module at the top of your file
const path = require('path');
const { title } = require('process');
const fs = require('fs').promises;
const N3StoreServiceFileSystem = require('./src/js/store/N3StoreServiceFileSystem');

try {
  require('electron-reloader')(module)
} catch (_) {}

log.info("Start NOW-Note app...");


const createWindow = () => {
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });

    mainWindow.webContents.openDevTools();
    mainWindow.loadFile('index.html')
    return mainWindow;
  }



  let n3 = {};

  app.whenReady().then(() => {
    let mainWindow = createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

    let userDataPath = app.getPath("userData");



    fs.readFile(userDataPath + "/settings.json", "utf-8").then(function(data) {
      n3.userSettings = JSON.parse(data);
      n3.store = new N3StoreServiceFileSystem(n3.userSettings);
    });


   
    ipcMain.handle("app:getUserSettings", function() {
      return n3.settings;
    });

    ipcMain.handle("app:getStoreConfig", function() {
      return n3.store.getStoreConfig(app.getVersion());
    });

    ipcMain.handle("app:close", function() {
      log.info("Want to shutdown NOW-Note app - close storage first");
      return n3.store.close().then(function() {
        log.info("Shutdown NOW-Note app...");
        mainWindow.destroy();
        return Promise.resolve();
      });
    });
    
    ipcMain.handle("store:loadNotes", function(event, key) {
      return n3.store.loadNotes(key);
    });

    ipcMain.handle("store:addNote", function(event, parentNoteKey, note, hitMode, relativeToKey) {
      return n3.store.addNote(parentNoteKey, note, hitMode, relativeToKey);
    });

    ipcMain.handle("store:modifyNote", function(event, note) {
      return n3.store.modifyNote(note);
    });

    ipcMain.handle("store:addFile", function(event, fileType, fileName, filePathOrBase64, fileTransferType) {
      return n3.store.addFile(fileType, fileName, filePathOrBase64, fileTransferType);
    });

    ipcMain.handle("store:moveNote", function(event, key, from, to, hitMode, relativTo) {
      log.debug("store:moveNote", key, from, to, hitMode, relativTo);
      return n3.store.moveNote(key, from, to, hitMode, relativTo);
    });

    ipcMain.handle("store:moveNoteToTrash", function(event, key, parent) {
      return n3.store.moveNoteToTrash(key, parent);
    });

    ipcMain.handle("store:inTrash", function(event, note) {
      return n3.store.inTrash(note);
    });

    ipcMain.handle("store:getNote", function(event, key) {
      return n3.store.getNote(key);
    });

    ipcMain.handle("store:getParents", function(event, key) {
      return n3.store.getParents(key);
    });

    ipcMain.handle("search:search", function(event, searchText, limit, trash) {
      return n3.store.search(searchText, limit, trash);
    });

    ipcMain.handle("search:getIndexedDocuments", function(event, limit) {
      return n3.store.getIndexedDocuments(limit);
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

  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })


