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

type VaultFile = {
    salt: string
    iv: string
    tag: string
    data: string
}

function vaultPath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
}

function deriveKey(password: string, salt: Buffer) {
    return crypto.scryptSync(password, salt, 32)
}

export async function loadVault(username: string, vaultPassword: string): Promise<VaultData> {
    const raw = await fs.readFile(vaultPath(username), 'utf8').catch(() => null)

    if (!raw) {
        return { entries: [] }
    }

    const parsed = JSON.parse(raw) as VaultFile

    const salt = Buffer.from(parsed.salt, 'base64')
    const iv = Buffer.from(parsed.iv, 'base64')
    const tag = Buffer.from(parsed.tag, 'base64')
    const encrypted = Buffer.from(parsed.data, 'base64')

    const key = deriveKey(vaultPassword, salt)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    const vault = JSON.parse(decrypted.toString('utf8')) as VaultData

    return {
        entries: Array.isArray(vault.entries) ? vault.entries : [],
    }
}

export async function saveVault(username: string, vaultPassword: string, data: VaultData) {
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(12)
    const key = deriveKey(vaultPassword, salt)

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()

    const payload: VaultFile = {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64'),
    }

    const file = vaultPath(username)

    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
}