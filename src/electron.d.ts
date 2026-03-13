//src/electron.d.ts
export { }

declare global {
    type VaultEntry = {
        id: string
        account: string
        username: string
        password: string
    }

    type VaultData = {
        entries: VaultEntry[]
    }

    type NoteEntry = {
        id: string
        title: string
        content: string
    }

    type NotesData = {
        notes: NoteEntry[]
    }

    interface AuthResult {
        ok: boolean
        error?: string
        username?: string
    }

    interface BasicResult {
        ok: boolean
        error?: string
    }

    interface DeleteUserResult {
        ok: boolean
        error?: string
        username?: string
    }

    interface VaultLoadResult {
        ok: boolean
        error?: string
        entries: VaultEntry[]
    }

    interface NotesLoadResult {
        ok: boolean
        error?: string
        notes: NoteEntry[]
    }

    interface Window {
        api: {
            createUser: (
                username: string,
                password: string,
                vaultPassword: string
            ) => Promise<AuthResult>

            login: (username: string, password: string) => Promise<AuthResult>

            unlockVault: (vaultPassword: string) => Promise<BasicResult>

            logout: () => Promise<BasicResult>

            changeLoginPassword: (
                currentPassword: string,
                newPassword: string
            ) => Promise<BasicResult>

            deleteCurrentUser: () => Promise<DeleteUserResult>

            loadVault: () => Promise<VaultLoadResult>

            saveVault: (data: VaultData) => Promise<BasicResult>

            loadNotes: () => Promise<NotesLoadResult>

            saveNotes: (data: NotesData) => Promise<BasicResult>

            setUnsavedNoteChanges: (value: boolean) => Promise<BasicResult>

            confirmCloseAfterPrompt: () => Promise<BasicResult>

            cancelCloseAfterPrompt: () => Promise<BasicResult>

            getVersion: () => Promise<string>

            copyToClipboard: (text: string) => Promise<BasicResult>

            copySecretToClipboard: (text: string) => Promise<BasicResult>

            onCloseRequested: (callback: () => void) => () => void
        }
    }
}