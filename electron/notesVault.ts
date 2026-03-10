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

type NotesFile = {
    salt: string
    iv: string
    tag: string
    data: string
}

function notesPath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.notes.vault`)
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

function normalizeNotesData(data: unknown): NotesData {
    if (!data || typeof data !== 'object') {
        return { notes: [] }
    }

    const maybeNotes = data as Partial<NotesData>

    return {
        notes: Array.isArray(maybeNotes.notes) ? maybeNotes.notes.filter(isNoteEntry) : [],
    }
}

export async function loadNotesVault(
    username: string,
    vaultPassword: string,
): Promise<NotesData> {
    const raw = await fs.readFile(notesPath(username), 'utf8').catch((error) => {
        const isFileMissing =
            error instanceof Error &&
            'code' in error &&
            (error as NodeJS.ErrnoException).code === 'ENOENT'

        if (isFileMissing) {
            return null
        }

        throw error
    })

    if (!raw) {
        return { notes: [] }
    }

    const parsed = JSON.parse(raw) as Partial<NotesFile>

    if (
        typeof parsed.salt !== 'string' ||
        typeof parsed.iv !== 'string' ||
        typeof parsed.tag !== 'string' ||
        typeof parsed.data !== 'string'
    ) {
        throw new Error('El archivo de anotaciones está dañado o tiene un formato inválido.')
    }

    const salt = Buffer.from(parsed.salt, 'base64')
    const iv = Buffer.from(parsed.iv, 'base64')
    const tag = Buffer.from(parsed.tag, 'base64')
    const encrypted = Buffer.from(parsed.data, 'base64')

    const key = deriveKey(vaultPassword, salt)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    const notes = JSON.parse(decrypted.toString('utf8'))

    return normalizeNotesData(notes)
}

export async function saveNotesVault(
    username: string,
    vaultPassword: string,
    data: NotesData,
) {
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

    const payload: NotesFile = {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64'),
    }

    const file = notesPath(username)

    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
}