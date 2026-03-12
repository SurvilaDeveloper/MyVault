//electron/main.ts
import {
    app,
    BrowserWindow,
    ipcMain,
    nativeTheme,
    Menu,
    shell,
    clipboard,
    type MenuItemConstructorOptions,
} from 'electron'
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
let helpWin: BrowserWindow | null = null
let aboutMyVaultWin: BrowserWindow | null = null
let aboutWin: BrowserWindow | null = null

let unlockedVaultPassword: string | null = null
let hasUnsavedNoteChanges = false
let isForceClosing = false
let closePromptPending = false

const isDev = !app.isPackaged
const WINDOW_BACKGROUND = '#020617'
const AUX_WINDOW_BACKGROUND = '#0f172a'

function getWindowIconPath() {
    if (isDev) {
        return path.join(app.getAppPath(), 'public', 'myvault.png')
    }

    return path.join(process.resourcesPath, 'public', 'myvault.png')
}

function applyNativeDarkTheme() {
    nativeTheme.themeSource = 'dark'
}

function getPreloadPath() {
    return path.join(__dirname, 'preload.mjs')
}

function getHelpPath() {
    return path.join(__dirname, '../dist-renderer/help.html')
}

function getAboutMyVaultPath() {
    return path.join(__dirname, '../dist-renderer/about-myvault.html')
}

function getAboutPath() {
    return path.join(__dirname, '../dist-renderer/about.html')
}

function isAllowedUrl(url: string) {
    if (isDev) {
        return url.startsWith('http://localhost:5173')
    }

    return url.startsWith('file://')
}

function isSafeExternalUrl(url: string) {
    return (
        url.startsWith('https://') ||
        url.startsWith('http://') ||
        url.startsWith('mailto:')
    )
}

function hardenWindow(target: BrowserWindow) {
    target.webContents.on('will-navigate', (event, url) => {
        if (isAllowedUrl(url)) return

        event.preventDefault()

        if (isSafeExternalUrl(url)) {
            void shell.openExternal(url)
        }
    })

    target.webContents.setWindowOpenHandler(({ url }) => {
        if (isSafeExternalUrl(url)) {
            void shell.openExternal(url)
        }

        return { action: 'deny' }
    })

    if (!isDev) {
        target.webContents.on('devtools-opened', () => {
            target.webContents.closeDevTools()
        })
    }
}

function createWindow() {
    isForceClosing = false
    closePromptPending = false

    applyNativeDarkTheme()

    win = new BrowserWindow({
        width: 1180,
        height: 730,
        minWidth: 940,
        minHeight: 680,
        title: 'MyVault',
        icon: getWindowIconPath(),
        backgroundColor: WINDOW_BACKGROUND,
        autoHideMenuBar: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    win.setBackgroundColor(WINDOW_BACKGROUND)
    hardenWindow(win)

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
        void win.loadFile(path.join(__dirname, '../dist-renderer/index.html'))
    }
}

function openHelpWindow() {
    if (helpWin && !helpWin.isDestroyed()) {
        helpWin.focus()
        return
    }

    helpWin = new BrowserWindow({
        width: 920,
        height: 700,
        minWidth: 760,
        minHeight: 560,
        title: 'Documentación - MyVault',
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        parent: win ?? undefined,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    helpWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    hardenWindow(helpWin)

    helpWin.on('closed', () => {
        helpWin = null
    })

    if (isDev) {
        void helpWin.loadURL('http://localhost:5173/help.html')
    } else {
        void helpWin.loadFile(getHelpPath())
    }
}

function openAboutMyVaultWindow() {
    if (aboutMyVaultWin && !aboutMyVaultWin.isDestroyed()) {
        aboutMyVaultWin.focus()
        return
    }

    aboutMyVaultWin = new BrowserWindow({
        width: 860,
        height: 720,
        minWidth: 700,
        minHeight: 520,
        title: 'Acerca de MyVault',
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        parent: win ?? undefined,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    aboutMyVaultWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    hardenWindow(aboutMyVaultWin)

    aboutMyVaultWin.on('closed', () => {
        aboutMyVaultWin = null
    })

    if (isDev) {
        void aboutMyVaultWin.loadURL('http://localhost:5173/about-myvault.html')
    } else {
        void aboutMyVaultWin.loadFile(getAboutMyVaultPath())
    }
}

function openAboutWindow() {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.focus()
        return
    }

    aboutWin = new BrowserWindow({
        width: 530,
        height: 530,
        minWidth: 530,
        minHeight: 530,
        title: 'Información del proyecto',
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        maximizable: false,
        minimizable: true,
        resizable: false,
        parent: win ?? undefined,
        modal: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    aboutWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    aboutWin.center()
    hardenWindow(aboutWin)

    aboutWin.on('closed', () => {
        aboutWin = null
    })

    if (isDev) {
        void aboutWin.loadURL('http://localhost:5173/about.html')
    } else {
        void aboutWin.loadFile(getAboutPath())
    }
}

function createAppMenu() {
    const isMac = process.platform === 'darwin'

    const appSubmenu: MenuItemConstructorOptions[] = [
        {
            label: 'About MyVault',
            click: () => openAboutMyVaultWindow(),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
    ]

    const fileSubmenu: MenuItemConstructorOptions[] = isMac ? [] : [{ role: 'quit' }]

    const editSubmenu: MenuItemConstructorOptions[] = isMac
        ? [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
        ]
        : [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
        ]

    const viewSubmenu: MenuItemConstructorOptions[] = [
        ...(isDev
            ? [
                { role: 'reload' as const },
                { role: 'forceReload' as const },
                { role: 'toggleDevTools' as const },
                { type: 'separator' as const },
            ]
            : []),
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
    ]

    const windowSubmenu: MenuItemConstructorOptions[] = isMac
        ? [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }]
        : [{ role: 'minimize' }, { role: 'close' }]

    const helpSubmenu: MenuItemConstructorOptions[] = [
        {
            label: 'Documentación',
            click: () => openHelpWindow(),
        },
        {
            label: 'Acerca de MyVault',
            click: () => openAboutMyVaultWindow(),
        },
        {
            label: 'Información del proyecto',
            click: () => openAboutWindow(),
        },
    ]

    const template: MenuItemConstructorOptions[] = [
        ...(isMac
            ? [
                {
                    label: app.name,
                    submenu: appSubmenu,
                },
            ]
            : []),
        {
            label: 'File',
            submenu: fileSubmenu,
        },
        {
            label: 'Edit',
            submenu: editSubmenu,
        },
        {
            label: 'View',
            submenu: viewSubmenu,
        },
        {
            label: 'Window',
            submenu: windowSubmenu,
        },
        {
            label: 'Help',
            submenu: helpSubmenu,
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

function vaultFilePath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
}

function notesFilePath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.notes.vault`)
}

ipcMain.handle('app:get-version', () => {
    return app.getVersion()
})

ipcMain.handle('app:copy-to-clipboard', async (_event, text: string) => {
    clipboard.writeText(text)
    return { ok: true }
})

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

app.whenReady().then(() => {
    applyNativeDarkTheme()
    createWindow()
    createAppMenu()
})

app.on('activate', () => {
    applyNativeDarkTheme()

    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        createAppMenu()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

process.on('unhandledRejection', (err) => {
    console.error('[main] unhandledRejection', err)
})