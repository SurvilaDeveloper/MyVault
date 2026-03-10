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

let currentUser: string | null = null

function authPath() {
    return path.join(app.getPath('userData'), 'auth.json')
}

function normalizeUsername(username: string) {
    return username.trim().toLowerCase()
}

async function readAuth(): Promise<AuthFile> {
    try {
        const raw = await fs.readFile(authPath(), 'utf8')
        const parsed = JSON.parse(raw) as Partial<AuthFile>

        return {
            users: Array.isArray(parsed.users)
                ? parsed.users.filter(
                    (u): u is AuthUser =>
                        typeof u?.username === 'string' &&
                        typeof u?.passwordHash === 'string' &&
                        typeof u?.vaultPasswordHash === 'string',
                )
                : [],
        }
    } catch {
        return { users: [] }
    }
}

async function writeAuth(data: AuthFile) {
    await fs.mkdir(path.dirname(authPath()), { recursive: true })
    await fs.writeFile(authPath(), JSON.stringify(data, null, 2), 'utf8')
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

    if (data.users.find((u) => u.username === normalizedUsername)) {
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

    const user = data.users.find((u) => u.username === normalizedUsername)

    if (!user) {
        return {
            ok: false,
            error: 'Usuario o contraseña incorrectos.',
        }
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
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

export async function verifyVaultPassword(username: string, vaultPassword: string) {
    const normalizedUsername = normalizeUsername(username)
    const data = await readAuth()

    const user = data.users.find((u) => u.username === normalizedUsername)

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

export function logout() {
    currentUser = null
}

export function getCurrentUser() {
    return currentUser
}