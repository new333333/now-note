const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('electronAPI', {
  
  // App
  quit: () => ipcRenderer.invoke("app:quit"),
  onClose: (callback) => ipcRenderer.on("wantClose", callback),
  setDirty: (dirty) => ipcRenderer.invoke("app:setDirty", dirty),

  // Repository
  onChangeRepository: (callback) => ipcRenderer.on("changeRepository", callback),
  chooseRepositoryFolder: () => ipcRenderer.invoke("app:chooseRepositoryFolder"),
  changeRepository: (repositoryFolder) => ipcRenderer.invoke("app:changeRepository", repositoryFolder),
  setRepositorySettings: (settings) => ipcRenderer.invoke("app:setRepositorySettings", settings),
  getRepositorySettings: () => ipcRenderer.invoke("app:getRepositorySettings"),
  closeRepository: () => ipcRenderer.invoke("app:closeRepository"),
  getRepositories: () => ipcRenderer.invoke("app:getRepositories"),
  isRepositoryInitialized: () => ipcRenderer.invoke("app:isRepositoryInitialized"),
  isRepositoryInitialized: () => ipcRenderer.invoke("app:isRepositoryInitialized"),
  getRepository: () => ipcRenderer.invoke("app:getRepository"),


  getChildren: (key, trash) => ipcRenderer.invoke("store:getChildren", key, trash),
  addNote: (parentNoteKey, note, hitMode, relativeToKey) => ipcRenderer.invoke("store:addNote", parentNoteKey, note, hitMode, relativeToKey),
  modifyNote: (note) => ipcRenderer.invoke("store:modifyNote", note),
  addTag: (key, tag) => ipcRenderer.invoke("store:addTag", key, tag),
  removeTag: (key, tag) => ipcRenderer.invoke("store:removeTag", key, tag),
  findTag: (tag) => ipcRenderer.invoke("store:findTag", tag),
  moveNote: (key, from, to, hitMode, relativTo) => ipcRenderer.invoke("store:moveNote", key, from, to, hitMode, relativTo),
  moveNoteToTrash: (key) => ipcRenderer.invoke("store:moveNoteToTrash", key),
  restore: (key) => ipcRenderer.invoke("store:restore", key),
  deletePermanently: (key) => ipcRenderer.invoke("store:deletePermanently", key),
  search: (searchText, limit, trash, options) => ipcRenderer.invoke("search:search", searchText, limit, trash, options),
  getNote: (key) => ipcRenderer.invoke("store:getNote", key),
  getNoteIndex: (key) => ipcRenderer.invoke("store:getNoteIndex", key),
  isTrash: (key) => ipcRenderer.invoke("store:isTrash", key),
  getParents: (key) => ipcRenderer.invoke("store:getParents", key),
  getBacklinks: (key) => ipcRenderer.invoke("store:getBacklinks", key),
  downloadAttachment: (url) => ipcRenderer.invoke("download-attachment", url),
  addFile: (parentKey, path, hitMode, relativeToKey) => ipcRenderer.invoke("store:addFile", parentKey, path, hitMode, relativeToKey),
  getPriorityStat: () => ipcRenderer.invoke("app:getPriorityStat"),
});

