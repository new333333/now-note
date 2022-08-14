const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getUserSettings: () => ipcRenderer.invoke("app:getUserSettings"),
  getStoreConfig: () => ipcRenderer.invoke("app:getStoreConfig"),
  loadNotes: (key) => ipcRenderer.invoke("store:loadNotes", key),
  addNote: (parentNoteKey, note, hitMode, relativeToKey) => ipcRenderer.invoke("store:addNote", parentNoteKey, note, hitMode, relativeToKey),
  modifyNote: (note) => ipcRenderer.invoke("store:modifyNote", note),
  addFile: (fileType, fileName, filePathOrBase64, fileTransferType) => ipcRenderer.invoke("store:addFile", fileType, fileName, filePathOrBase64, fileTransferType),
  moveNote: (key, from, to, hitMode, relativTo) => ipcRenderer.invoke("store:moveNote", key, from, to, hitMode, relativTo),
  close: () => ipcRenderer.invoke("app:close"),
  downloadAttachment: (url) => ipcRenderer.invoke("download-attachment", url),
  moveNoteToTrash: (key, parent) => ipcRenderer.invoke("store:moveNoteToTrash", key, parent),
  inTrash: (note) => ipcRenderer.invoke("store:inTrash", note),
  getParents: (key) => ipcRenderer.invoke("store:getParents", key),
  getNote: (key) => ipcRenderer.invoke("store:getNote", key),
  search: (searchText, limit, trash) => ipcRenderer.invoke("search:search", searchText, limit, trash),
  getIndexedDocuments: (limit) => ipcRenderer.invoke("search:getIndexedDocuments", limit),

})