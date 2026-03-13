//electron/auth.ts
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import bcrypt from 'bcryptjs'

type AuthUser = {
    username: string
    passwordHash: string
    vaultPasswordHash: string
}

type AuthFile = {
    users: AuthUser[]
}

type BasicResult = {
    ok: boolean
    error?: string
}

let currentUser: string | null = null

function authPath() {
    return path.join(app.getPath('userData'), 'auth.json')
}

function authTempPath() {
    return `${authPath()}.tmp`
}

function normalizeUsername(username: string) {
    return username.trim().toLowerCase()
}

function isAuthUser(value: unknown): value is AuthUser {
    if (!value || typeof value !== 'object') return false

    const user = value as AuthUser

    return (
        typeof user.username === 'string' &&
        typeof user.passwordHash === 'string' &&
        typeof user.vaultPasswordHash === 'string'
    )
}

function normalizeAuthFile(data: unknown): AuthFile {
    if (!data || typeof data !== 'object') {
        return { users: [] }
    }

    const parsed = data as Partial<AuthFile>

    return {
        users: Array.isArray(parsed.users) ? parsed.users.filter(isAuthUser) : [],
    }
}

async function removeIfExists(filePath: string) {
    try {
        await fs.rm(filePath, { force: true })
    } catch {
        // No interrumpir por fallas de limpieza.
    }
}

async function writeFileAtomically(filePath: string, content: string) {
    const tempPath = `${filePath}.tmp`

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await removeIfExists(tempPath)
    await fs.writeFile(tempPath, content, 'utf8')
    await fs.rename(tempPath, filePath)
}

async function readAuth(): Promise<AuthFile> {
    try {
        const raw = await fs.readFile(authPath(), 'utf8')
        const parsed = JSON.parse(raw) as unknown
        return normalizeAuthFile(parsed)
    } catch (error) {
        const isFileMissing =
            error instanceof Error &&
            'code' in error &&
            (error as NodeJS.ErrnoException).code === 'ENOENT'

        if (isFileMissing) {
            return { users: [] }
        }

        throw new Error('No se pudo leer el archivo de autenticación.')
    }
}

async function writeAuth(data: AuthFile) {
    const normalized = normalizeAuthFile(data)
    await writeFileAtomically(authPath(), JSON.stringify(normalized, null, 2))
}

function findUser(data: AuthFile, username: string) {
    const normalizedUsername = normalizeUsername(username)
    return data.users.find((u) => u.username === normalizedUsername) ?? null
}

export async function createUser(
    username: string,
    password: string,
    vaultPassword: string,
) {
    const normalizedUsername = normalizeUsername(username)
    const trimmedPassword = password.trim()
    const trimmedVaultPassword = vaultPassword.trim()

    if (!normalizedUsername) {
        throw new Error('El usuario no puede estar vacío.')
    }

    if (!trimmedPassword) {
        throw new Error('La contraseña de login no puede estar vacía.')
    }

    if (!trimmedVaultPassword) {
        throw new Error('La master password no puede estar vacía.')
    }

    const data = await readAuth()

    if (findUser(data, normalizedUsername)) {
        throw new Error('Ese usuario ya existe.')
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10)
    const vaultPasswordHash = await bcrypt.hash(trimmedVaultPassword, 10)

    data.users.push({
        username: normalizedUsername,
        passwordHash,
        vaultPasswordHash,
    })

    await writeAuth(data)

    return {
        ok: true,
        username: normalizedUsername,
    }
}

export async function login(username: string, password: string) {
    const normalizedUsername = normalizeUsername(username)
    const data = await readAuth()

    const user = findUser(data, normalizedUsername)

    if (!user) {
        currentUser = null
        return {
            ok: false,
            error: 'Usuario o contraseña incorrectos.',
        }
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
        currentUser = null
        return {
            ok: false,
            error: 'Usuario o contraseña incorrectos.',
        }
    }

    currentUser = user.username

    return {
        ok: true,
        username: user.username,
    }
}

export async function verifyVaultPassword(username: string, vaultPassword: string): Promise<BasicResult> {
    const normalizedUsername = normalizeUsername(username)
    const data = await readAuth()

    const user = findUser(data, normalizedUsername)

    if (!user) {
        return {
            ok: false,
            error: 'Usuario inexistente.',
        }
    }

    const valid = await bcrypt.compare(vaultPassword, user.vaultPasswordHash)

    if (!valid) {
        return {
            ok: false,
            error: 'Master password incorrecta.',
        }
    }

    return {
        ok: true,
    }
}

export async function changeLoginPassword(
    username: string,
    currentPassword: string,
    newPassword: string,
): Promise<BasicResult> {
    const normalizedUsername = normalizeUsername(username)
    const trimmedCurrentPassword = currentPassword.trim()
    const trimmedNewPassword = newPassword.trim()

    if (!trimmedCurrentPassword) {
        return {
            ok: false,
            error: 'La contraseña actual no puede estar vacía.',
        }
    }

    if (!trimmedNewPassword) {
        return {
            ok: false,
            error: 'La nueva contraseña no puede estar vacía.',
        }
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
        return {
            ok: false,
            error: 'La nueva contraseña no puede ser igual a la actual.',
        }
    }

    const data = await readAuth()
    const user = findUser(data, normalizedUsername)

    if (!user) {
        return {
            ok: false,
            error: 'Usuario inexistente.',
        }
    }

    const valid = await bcrypt.compare(trimmedCurrentPassword, user.passwordHash)

    if (!valid) {
        return {
            ok: false,
            error: 'La contraseña actual es incorrecta.',
        }
    }

    user.passwordHash = await bcrypt.hash(trimmedNewPassword, 10)
    await writeAuth(data)

    return { ok: true }
}

export async function updateVaultPasswordHash(
    username: string,
    newVaultPassword: string,
): Promise<BasicResult> {
    const normalizedUsername = normalizeUsername(username)
    const trimmedNewVaultPassword = newVaultPassword.trim()

    if (!trimmedNewVaultPassword) {
        return {
            ok: false,
            error: 'La nueva master password no puede estar vacía.',
        }
    }

    const data = await readAuth()
    const user = findUser(data, normalizedUsername)

    if (!user) {
        return {
            ok: false,
            error: 'Usuario inexistente.',
        }
    }

    user.vaultPasswordHash = await bcrypt.hash(trimmedNewVaultPassword, 10)
    await writeAuth(data)

    return { ok: true }
}

export async function deleteCurrentUser() {
    if (!currentUser) {
        throw new Error('No hay usuario logueado.')
    }

    const data = await readAuth()
    const nextUsers = data.users.filter((u) => u.username !== currentUser)

    await writeAuth({ users: nextUsers })

    const deletedUsername = currentUser
    currentUser = null

    return {
        ok: true,
        username: deletedUsername,
    }
}

export async function cleanupAuthTempFile() {
    await removeIfExists(authTempPath())
}

export function logout() {
    currentUser = null
}

export function getCurrentUser() {
    return currentUser
}