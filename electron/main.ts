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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let win: BrowserWindow | null = null
let unlockedVaultPassword: string | null = null

const isDev = !app.isPackaged

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 940,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function vaultFilePath(username: string) {
  return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
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

    unlockedVaultPassword = null

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