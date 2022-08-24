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
  getNote: (key) => ipcRenderer.invoke("store:getNote", key),
  isTrash: (key) => ipcRenderer.invoke("store:isTrash", key),
  getParents: (key) => ipcRenderer.invoke("store:getParents", key),
  //addAsset: (fileType, fileName, filePathOrBase64, fileTransferType) => ipcRenderer.invoke("store:addAsset", fileType, fileName, filePathOrBase64, fileTransferType),
  downloadAttachment: (url) => ipcRenderer.invoke("download-attachment", url),
  addFile: (parentKey, path, hitMode, relativeToKey) => ipcRenderer.invoke("store:addFile", parentKey, path, hitMode, relativeToKey),
});