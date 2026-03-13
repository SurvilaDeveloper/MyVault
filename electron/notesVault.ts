//electron/notesVault.ts
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'

export type NoteEntry = {
    id: string
    title: string
    content: string
}

export type NotesData = {
    notes: NoteEntry[]
}

export type NotesFile = {
    salt: string
    iv: string
    tag: string
    data: string
}

function notesPath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.notes.vault`)
}

export function getNotesFilePath(username: string) {
    return notesPath(username)
}

export function getNotesTempFilePath(username: string) {
    return `${notesPath(username)}.tmp`
}

function deriveKey(password: string, salt: Buffer) {
    return crypto.scryptSync(password, salt, 32)
}

function isNoteEntry(value: unknown): value is NoteEntry {
    if (!value || typeof value !== 'object') return false

    const note = value as NoteEntry

    return (
        typeof note.id === 'string' &&
        typeof note.title === 'string' &&
        typeof note.content === 'string'
    )
}

function isNotesFile(value: unknown): value is NotesFile {
    if (!value || typeof value !== 'object') return false

    const file = value as NotesFile

    return (
        typeof file.salt === 'string' &&
        typeof file.iv === 'string' &&
        typeof file.tag === 'string' &&
        typeof file.data === 'string'
    )
}

function normalizeNotesData(data: unknown): NotesData {
    if (!data || typeof data !== 'object') {
        return { notes: [] }
    }

    const maybeNotes = data as Partial<NotesData>

    return {
        notes: Array.isArray(maybeNotes.notes) ? maybeNotes.notes.filter(isNoteEntry) : [],
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

export function encryptNotesData(vaultPassword: string, data: NotesData): NotesFile {
    const normalized = normalizeNotesData(data)

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

export function decryptNotesFile(vaultPassword: string, file: NotesFile): NotesData {
    const salt = Buffer.from(file.salt, 'base64')
    const iv = Buffer.from(file.iv, 'base64')
    const tag = Buffer.from(file.tag, 'base64')
    const encrypted = Buffer.from(file.data, 'base64')

    const key = deriveKey(vaultPassword, salt)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    const notes = JSON.parse(decrypted.toString('utf8'))

    return normalizeNotesData(notes)
}

export async function loadNotesVault(
    username: string,
    vaultPassword: string,
): Promise<NotesData> {
    const filePath = notesPath(username)
    const raw = await readTextFileIfExists(filePath)

    if (!raw) {
        return { notes: [] }
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isNotesFile(parsed)) {
        throw new Error('El archivo de anotaciones está dañado o tiene un formato inválido.')
    }

    return decryptNotesFile(vaultPassword, parsed)
}

export async function writeNotesFileAtPath(filePath: string, payload: NotesFile) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

export async function replaceNotesFileAtomically(username: string, payload: NotesFile) {
    const finalPath = getNotesFilePath(username)
    const tempPath = getNotesTempFilePath(username)

    await fs.mkdir(path.dirname(finalPath), { recursive: true })
    await removeIfExists(tempPath)
    await writeNotesFileAtPath(tempPath, payload)
    await fs.rename(tempPath, finalPath)
}

export async function cleanupNotesTempFile(username: string) {
    await removeIfExists(getNotesTempFilePath(username))
}

export async function saveNotesVault(
    username: string,
    vaultPassword: string,
    data: NotesData,
) {
    const payload = encryptNotesData(vaultPassword, data)
    await writeNotesFileAtPath(notesPath(username), payload)
}