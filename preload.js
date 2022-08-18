const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getUserSettings: () => ipcRenderer.invoke("app:getUserSettings"),
  getRepository: () => ipcRenderer.invoke("app:getRepository"),
  shutdown: () => ipcRenderer.invoke("app:shutdown"),
  getChildren: (key) => ipcRenderer.invoke("store:getChildren", key),
  addNote: (parentNoteKey, note, hitMode, relativeToKey) => ipcRenderer.invoke("store:addNote", parentNoteKey, note, hitMode, relativeToKey),
  modifyNote: (note) => ipcRenderer.invoke("store:modifyNote", note),
  addTag: (key, tag) => ipcRenderer.invoke("store:addTag", key, tag),
  removeTag: (key, tag) => ipcRenderer.invoke("store:removeTag", key, tag),
  moveNote: (key, from, to, hitMode, relativTo) => ipcRenderer.invoke("store:moveNote", key, from, to, hitMode, relativTo),
  moveNoteToTrash: (key, parent) => ipcRenderer.invoke("store:moveNoteToTrash", key, parent),


  search: (searchText, limit, trash) => ipcRenderer.invoke("search:search", searchText, limit, trash),

  
  // test when links are there
  getNote: (key) => ipcRenderer.invoke("store:getNote", key),
  inTrash: (key) => ipcRenderer.invoke("store:inTrash", key),
  // test by search link
  getParents: (key) => ipcRenderer.invoke("store:getParents", key),

  addFile: (fileType, fileName, filePathOrBase64, fileTransferType) => ipcRenderer.invoke("store:addFile", fileType, fileName, filePathOrBase64, fileTransferType),
  downloadAttachment: (url) => ipcRenderer.invoke("download-attachment", url),
  getIndexedDocuments: (limit) => ipcRenderer.invoke("search:getIndexedDocuments", limit),

});