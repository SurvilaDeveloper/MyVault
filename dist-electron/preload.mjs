"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  createUser: (username, password, vaultPassword) => electron.ipcRenderer.invoke("auth:create", username, password, vaultPassword),
  login: (username, password) => electron.ipcRenderer.invoke("auth:login", username, password),
  unlockVault: (vaultPassword) => electron.ipcRenderer.invoke("auth:unlockVault", vaultPassword),
  logout: () => electron.ipcRenderer.invoke("auth:logout"),
  deleteCurrentUser: () => electron.ipcRenderer.invoke("auth:deleteCurrentUser"),
  loadVault: () => electron.ipcRenderer.invoke("vault:load"),
  saveVault: (data) => electron.ipcRenderer.invoke("vault:save", data),
  loadNotes: () => electron.ipcRenderer.invoke("notes:load"),
  saveNotes: (data) => electron.ipcRenderer.invoke("notes:save", data)
});
