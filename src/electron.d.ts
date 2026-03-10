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

            deleteCurrentUser: () => Promise<DeleteUserResult>

            loadVault: () => Promise<VaultLoadResult>

            saveVault: (data: VaultData) => Promise<BasicResult>
        }
    }
}