//src/types/app-types.ts
export type View = 'auth' | 'unlock' | 'home' | 'passwords' | 'notes'

export type Entry = {
    id: string
    account: string
    username: string
    password: string
}

export type Note = {
    id: string
    title: string
    content: string
}

export type UnsavedPromptAction =
    | 'go-home'
    | 'close-app'
    | 'switch-note'
    | 'new-note'