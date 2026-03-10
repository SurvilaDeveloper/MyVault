//electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import {
  createUser,
  login,
  logout,
  getCurrentUser,
  verifyVaultPassword,
  deleteCurrentUser,
} from './auth'
import { loadVault, saveVault, type VaultData } from './vault'
import { loadNotesVault, saveNotesVault, type NotesData } from './notesVault'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let win: BrowserWindow | null = null
let unlockedVaultPassword: string | null = null
let hasUnsavedNoteChanges = false
let isForceClosing = false
let closePromptPending = false

const isDev = !app.isPackaged

function getWindowIconPath() {
  if (isDev) {
    return path.join(app.getAppPath(), 'public', 'myvault.png')
  }

  return path.join(process.resourcesPath, 'public', 'myvault.png')
}

function createWindow() {
  isForceClosing = false
  closePromptPending = false

  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 940,
    minHeight: 680,
    title: 'MyVault',
    icon: getWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.on('close', (event) => {
    if (isForceClosing) return

    if (hasUnsavedNoteChanges) {
      event.preventDefault()

      if (!closePromptPending) {
        closePromptPending = true
        win?.webContents.send('app:close-requested')
      }
    }
  })

  if (isDev) {
    void win.loadURL('http://localhost:5173')
  } else {
    void win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function vaultFilePath(username: string) {
  return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
}

function notesFilePath(username: string) {
  return path.join(app.getPath('userData'), 'vaults', `${username}.notes.vault`)
}

ipcMain.handle(
  'auth:create',
  async (_event, username: string, password: string, vaultPassword: string) => {
    try {
      return await createUser(username, password, vaultPassword)
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudo crear el usuario.',
      }
    }
  },
)

ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
  try {
    unlockedVaultPassword = null
    return await login(username, password)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
    }
  }
})

ipcMain.handle('auth:unlockVault', async (_event, vaultPassword: string) => {
  try {
    const user = getCurrentUser()

    if (!user) {
      return {
        ok: false,
        error: 'No hay sesión iniciada.',
      }
    }

    const result = await verifyVaultPassword(user, vaultPassword)

    if (!result.ok) {
      return result
    }

    unlockedVaultPassword = vaultPassword

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo desbloquear el vault.',
    }
  }
})

ipcMain.handle('auth:logout', async () => {
  logout()
  unlockedVaultPassword = null
  hasUnsavedNoteChanges = false
  return { ok: true }
})

ipcMain.handle('auth:deleteCurrentUser', async () => {
  try {
    const current = getCurrentUser()

    if (!current) {
      return {
        ok: false,
        error: 'No hay usuario logueado.',
      }
    }

    const result = await deleteCurrentUser()

    const vaultPath = vaultFilePath(current)
    await fs.rm(vaultPath, { force: true })

    const notesPath = notesFilePath(current)
    await fs.rm(notesPath, { force: true })

    unlockedVaultPassword = null
    hasUnsavedNoteChanges = false

    return result
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
    }
  }
})

ipcMain.handle('vault:load', async () => {
  const user = getCurrentUser()

  if (!user || !unlockedVaultPassword) {
    return {
      ok: false,
      error: 'Vault bloqueado o sesión inexistente.',
      entries: [],
    }
  }

  try {
    const vault = await loadVault(user, unlockedVaultPassword)
    return {
      ok: true,
      entries: vault.entries,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo cargar el vault.',
      entries: [],
    }
  }
})

ipcMain.handle('vault:save', async (_event, data: VaultData) => {
  const user = getCurrentUser()

  if (!user || !unlockedVaultPassword) {
    return {
      ok: false,
      error: 'Vault bloqueado o sesión inexistente.',
    }
  }

  try {
    await saveVault(user, unlockedVaultPassword, data)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar el vault.',
    }
  }
})

ipcMain.handle('notes:load', async () => {
  const user = getCurrentUser()

  if (!user || !unlockedVaultPassword) {
    return {
      ok: false,
      error: 'Anotaciones bloqueadas o sesión inexistente.',
      notes: [],
    }
  }

  try {
    const notes = await loadNotesVault(user, unlockedVaultPassword)
    return {
      ok: true,
      notes: notes.notes,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudieron cargar las anotaciones.',
      notes: [],
    }
  }
})

ipcMain.handle('notes:save', async (_event, data: NotesData) => {
  const user = getCurrentUser()

  if (!user || !unlockedVaultPassword) {
    return {
      ok: false,
      error: 'Anotaciones bloqueadas o sesión inexistente.',
    }
  }

  try {
    await saveNotesVault(user, unlockedVaultPassword, data)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudieron guardar las anotaciones.',
    }
  }
})

ipcMain.handle('app:set-unsaved-note-changes', async (_event, value: boolean) => {
  hasUnsavedNoteChanges = value
  return { ok: true }
})

ipcMain.handle('app:confirm-close-after-prompt', async () => {
  closePromptPending = false
  hasUnsavedNoteChanges = false
  isForceClosing = true
  win?.close()
  return { ok: true }
})

ipcMain.handle('app:cancel-close-after-prompt', async () => {
  closePromptPending = false
  return { ok: true }
})

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('unhandledRejection', (err) => {
  console.error('[main] unhandledRejection', err)
})