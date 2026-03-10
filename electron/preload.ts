//electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { VaultData } from './vault'
import type { NotesData } from './notesVault'

contextBridge.exposeInMainWorld('api', {
  createUser: (username: string, password: string, vaultPassword: string) =>
    ipcRenderer.invoke('auth:create', username, password, vaultPassword),

  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),

  unlockVault: (vaultPassword: string) =>
    ipcRenderer.invoke('auth:unlockVault', vaultPassword),

  logout: () => ipcRenderer.invoke('auth:logout'),

  deleteCurrentUser: () => ipcRenderer.invoke('auth:deleteCurrentUser'),

  loadVault: () => ipcRenderer.invoke('vault:load'),

  saveVault: (data: VaultData) => ipcRenderer.invoke('vault:save', data),

  loadNotes: () => ipcRenderer.invoke('notes:load'),

  saveNotes: (data: NotesData) => ipcRenderer.invoke('notes:save', data),
})