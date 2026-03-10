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
  saveNotes: (data) => electron.ipcRenderer.invoke("notes:save", data),
  setUnsavedNoteChanges: (value) => electron.ipcRenderer.invoke("app:set-unsaved-note-changes", value),
  confirmCloseAfterPrompt: () => electron.ipcRenderer.invoke("app:confirm-close-after-prompt"),
  cancelCloseAfterPrompt: () => electron.ipcRenderer.invoke("app:cancel-close-after-prompt"),
  onCloseRequested: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("app:close-requested", listener);
    return () => {
      electron.ipcRenderer.removeListener("app:close-requested", listener);
    };
  }
});
