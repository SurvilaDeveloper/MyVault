/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface AuthStatusResult {
  hasUsers: boolean
  authenticated: boolean
  username: string | null
  users: string[]
}

interface BasicAuthResult {
  ok: boolean
  error?: string
  username?: string
}

interface OpenTextFileResult {
  canceled: boolean
  filePath?: string
  content?: string
  error?: string
}

interface SaveTextFileResult {
  canceled: boolean
  filePath?: string
  error?: string
}

interface Window {
  electronAPI: {
    authGetStatus: () => Promise<AuthStatusResult>
    authSetupFirstUser: (username: string, password: string) => Promise<BasicAuthResult>
    authCreateUser: (username: string, password: string) => Promise<BasicAuthResult>
    authLogin: (username: string, password: string) => Promise<BasicAuthResult>
    authLogout: () => Promise<BasicAuthResult>

    openTextFile: () => Promise<OpenTextFileResult>
    saveTextFile: (filePath: string | null, content: string) => Promise<SaveTextFileResult>
    saveTextFileAs: (content: string) => Promise<SaveTextFileResult>
  }
}
