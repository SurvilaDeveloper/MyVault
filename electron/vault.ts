//electron/vault.ts
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'

export type VaultEntry = {
    id: string
    account: string
    username: string
    password: string
}

export type VaultData = {
    entries: VaultEntry[]
}

export type VaultFile = {
    salt: string
    iv: string
    tag: string
    data: string
}

function vaultPath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
}

export function getVaultFilePath(username: string) {
    return vaultPath(username)
}

export function getVaultTempFilePath(username: string) {
    return `${vaultPath(username)}.tmp`
}

function deriveKey(password: string, salt: Buffer) {
    return crypto.scryptSync(password, salt, 32)
}

function isVaultEntry(value: unknown): value is VaultEntry {
    if (!value || typeof value !== 'object') return false

    const entry = value as VaultEntry

    return (
        typeof entry.id === 'string' &&
        typeof entry.account === 'string' &&
        typeof entry.username === 'string' &&
        typeof entry.password === 'string'
    )
}

function isVaultFile(value: unknown): value is VaultFile {
    if (!value || typeof value !== 'object') return false

    const file = value as VaultFile

    return (
        typeof file.salt === 'string' &&
        typeof file.iv === 'string' &&
        typeof file.tag === 'string' &&
        typeof file.data === 'string'
    )
}

function normalizeVaultData(data: unknown): VaultData {
    if (!data || typeof data !== 'object') {
        return { entries: [] }
    }

    const maybeVault = data as Partial<VaultData>

    return {
        entries: Array.isArray(maybeVault.entries)
            ? maybeVault.entries.filter(isVaultEntry)
            : [],
    }
}

async function readTextFileIfExists(filePath: string) {
    try {
        return await fs.readFile(filePath, 'utf8')
    } catch (error) {
        const isFileMissing =
            error instanceof Error &&
            'code' in error &&
            (error as NodeJS.ErrnoException).code === 'ENOENT'

        if (isFileMissing) {
            return null
        }

        throw error
    }
}

async function removeIfExists(filePath: string) {
    try {
        await fs.rm(filePath, { force: true })
    } catch {
        // No interrumpir por fallas de limpieza.
    }
}

export function encryptVaultData(vaultPassword: string, data: VaultData): VaultFile {
    const normalized = normalizeVaultData(data)

    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(12)
    const key = deriveKey(vaultPassword, salt)

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(normalized), 'utf8'),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()

    return {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64'),
    }
}

export function decryptVaultFile(vaultPassword: string, file: VaultFile): VaultData {
    const salt = Buffer.from(file.salt, 'base64')
    const iv = Buffer.from(file.iv, 'base64')
    const tag = Buffer.from(file.tag, 'base64')
    const encrypted = Buffer.from(file.data, 'base64')

    const key = deriveKey(vaultPassword, salt)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    const vault = JSON.parse(decrypted.toString('utf8'))

    return normalizeVaultData(vault)
}

export async function loadVault(
    username: string,
    vaultPassword: string,
): Promise<VaultData> {
    const filePath = vaultPath(username)
    const raw = await readTextFileIfExists(filePath)

    if (!raw) {
        return { entries: [] }
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isVaultFile(parsed)) {
        throw new Error('El archivo del vault está dañado o tiene un formato inválido.')
    }

    return decryptVaultFile(vaultPassword, parsed)
}

export async function writeVaultFileAtPath(filePath: string, payload: VaultFile) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

export async function replaceVaultFileAtomically(username: string, payload: VaultFile) {
    const finalPath = getVaultFilePath(username)
    const tempPath = getVaultTempFilePath(username)

    await fs.mkdir(path.dirname(finalPath), { recursive: true })
    await removeIfExists(tempPath)
    await writeVaultFileAtPath(tempPath, payload)
    await fs.rename(tempPath, finalPath)
}

export async function cleanupVaultTempFile(username: string) {
    await removeIfExists(getVaultTempFilePath(username))
}

export async function saveVault(username: string, vaultPassword: string, data: VaultData) {
    const payload = encryptVaultData(vaultPassword, data)
    await writeVaultFileAtPath(vaultPath(username), payload)
}