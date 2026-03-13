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

  changeLoginPassword: (currentPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:changeLoginPassword', currentPassword, newPassword),

  changeVaultPassword: (currentVaultPassword: string, newVaultPassword: string) =>
    ipcRenderer.invoke(
      'auth:changeVaultPassword',
      currentVaultPassword,
      newVaultPassword,
    ),

  deleteCurrentUser: () => ipcRenderer.invoke('auth:deleteCurrentUser'),

  loadVault: () => ipcRenderer.invoke('vault:load'),

  saveVault: (data: VaultData) => ipcRenderer.invoke('vault:save', data),

  loadNotes: () => ipcRenderer.invoke('notes:load'),

  saveNotes: (data: NotesData) => ipcRenderer.invoke('notes:save', data),

  setUnsavedNoteChanges: (value: boolean) =>
    ipcRenderer.invoke('app:set-unsaved-note-changes', value),

  confirmCloseAfterPrompt: () => ipcRenderer.invoke('app:confirm-close-after-prompt'),

  cancelCloseAfterPrompt: () => ipcRenderer.invoke('app:cancel-close-after-prompt'),

  getVersion: () => ipcRenderer.invoke('app:get-version'),

  copyToClipboard: (text: string) =>
    ipcRenderer.invoke('app:copy-to-clipboard', text),

  copySecretToClipboard: (text: string) =>
    ipcRenderer.invoke('app:copy-secret-to-clipboard', text),

  onCloseRequested: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('app:close-requested', listener)

    return () => {
      ipcRenderer.removeListener('app:close-requested', listener)
    }
  },
})