//src/App.tsx
import { useEffect, useMemo, useState } from 'react'
import { AuthView } from './components/views/AuthView'
import { HomeView } from './components/views/HomeView'
import { NotesView } from './components/views/NotesView'
import { PasswordsView } from './components/views/PasswordsView'
import { UnlockView } from './components/views/UnlockView'
import { UnsavedChangesModal } from './components/UnsavedChangesModal'
import type { Entry, Note, UnsavedPromptAction, View } from './types/app-types'

function createEmptyNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
  }
}

function areNotesEqual(a: Note | null, b: Note | null) {
  if (!a && !b) return true
  if (!a || !b) return false

  return a.id === b.id && a.title === b.title && a.content === b.content
}

export default function App() {
  const [view, setView] = useState<View>('auth')

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('')
  const [registerVaultPassword, setRegisterVaultPassword] = useState('')
  const [registerVaultPasswordConfirm, setRegisterVaultPasswordConfirm] = useState('')

  const [unlockPassword, setUnlockPassword] = useState('')

  const [entries, setEntries] = useState<Entry[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Note | null>(null)
  const [notesSearch, setNotesSearch] = useState('')

  const [status, setStatus] = useState('Listo')
  const [savingPasswords, setSavingPasswords] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const [unsavedPromptAction, setUnsavedPromptAction] =
    useState<UnsavedPromptAction | null>(null)
  const [pendingNoteSelectionId, setPendingNoteSelectionId] = useState<string | null>(null)

  useEffect(() => {
    if (view !== 'passwords') return

    void (async () => {
      const result = await window.api.loadVault()

      if (!result.ok) {
        setStatus(result.error ?? 'No se pudo cargar el vault.')
        return
      }

      setEntries(result.entries)
      setVisiblePasswords({})
      setStatus('Contraseñas cargadas.')
    })()
  }, [view])

  useEffect(() => {
    if (view !== 'notes') return

    void (async () => {
      const result = await window.api.loadNotes()

      if (!result.ok) {
        setStatus(result.error ?? 'No se pudieron cargar las anotaciones.')
        return
      }

      setNotes(result.notes)

      if (result.notes.length > 0) {
        setSelectedNoteId((prev) => {
          if (prev && result.notes.some((note) => note.id === prev)) return prev
          return result.notes[0].id
        })
      } else {
        setSelectedNoteId(null)
        setNoteDraft(null)
      }

      setStatus('Anotaciones cargadas.')
    })()
  }, [view])

  useEffect(() => {
    if (!selectedNoteId) {
      setNoteDraft(null)
      return
    }

    const selected = notes.find((note) => note.id === selectedNoteId)

    if (!selected) {
      setNoteDraft((prev) => {
        if (prev && prev.id === selectedNoteId) return prev
        return null
      })
      return
    }

    setNoteDraft((prev) => {
      if (
        prev &&
        prev.id === selected.id &&
        prev.title === selected.title &&
        prev.content === selected.content
      ) {
        return prev
      }

      return { ...selected }
    })
  }, [selectedNoteId, notes])

  const totalEntries = useMemo(() => entries.length, [entries])
  const totalNotes = useMemo(() => notes.length, [notes])

  const savedSelectedNote = useMemo(() => {
    if (!selectedNoteId) return null
    return notes.find((note) => note.id === selectedNoteId) ?? null
  }, [notes, selectedNoteId])

  const noteHasUnsavedChanges = useMemo(() => {
    return !areNotesEqual(noteDraft, savedSelectedNote)
  }, [noteDraft, savedSelectedNote])

  const effectiveNotesForSidebar = useMemo(() => {
    if (!noteDraft) return notes

    const exists = notes.some((note) => note.id === noteDraft.id)

    if (exists) {
      return notes.map((note) => (note.id === noteDraft.id ? noteDraft : note))
    }

    return [noteDraft, ...notes]
  }, [notes, noteDraft])

  const filteredNotes = useMemo(() => {
    const q = notesSearch.trim().toLowerCase()

    if (!q) return effectiveNotesForSidebar

    return effectiveNotesForSidebar.filter((note) =>
      note.title.trim().toLowerCase().includes(q),
    )
  }, [effectiveNotesForSidebar, notesSearch])

  useEffect(() => {
    void window.api.setUnsavedNoteChanges(view === 'notes' && noteHasUnsavedChanges)
  }, [view, noteHasUnsavedChanges])

  useEffect(() => {
    const unsubscribe = window.api.onCloseRequested(() => {
      if (view === 'notes' && noteHasUnsavedChanges) {
        setUnsavedPromptAction('close-app')
        return
      }

      void window.api.confirmCloseAfterPrompt()
    })

    return unsubscribe
  }, [view, noteHasUnsavedChanges])

  async function handleLogin() {
    setStatus('Iniciando sesión...')

    const result = await window.api.login(loginUsername.trim(), loginPassword)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo iniciar sesión.')
      return
    }

    setLoginPassword('')
    setUnlockPassword('')
    setView('unlock')
    setStatus('Sesión iniciada. Ahora desbloqueá el vault.')
  }

  async function handleCreateUser() {
    if (registerPassword !== registerPasswordConfirm) {
      setStatus('La confirmación de la contraseña de login no coincide.')
      return
    }

    if (registerVaultPassword !== registerVaultPasswordConfirm) {
      setStatus('La confirmación de la master password no coincide.')
      return
    }

    setStatus('Creando usuario...')

    const result = await window.api.createUser(
      registerUsername.trim(),
      registerPassword,
      registerVaultPassword,
    )

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo crear el usuario.')
      return
    }

    setRegisterUsername('')
    setRegisterPassword('')
    setRegisterPasswordConfirm('')
    setRegisterVaultPassword('')
    setRegisterVaultPasswordConfirm('')
    setStatus('Usuario creado correctamente. Ahora podés iniciar sesión.')
  }

  async function handleUnlockVault() {
    setStatus('Desbloqueando vault...')

    const result = await window.api.unlockVault(unlockPassword)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo desbloquear el vault.')
      return
    }

    setUnlockPassword('')
    setView('home')
    setStatus('Vault desbloqueado.')
  }

  async function handleSavePasswords() {
    setSavingPasswords(true)
    setStatus('Guardando contraseñas...')

    const result = await window.api.saveVault({ entries })

    setSavingPasswords(false)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo guardar.')
      return
    }

    setStatus('Contraseñas guardadas.')
  }

  function toggleEntryPassword(entryId: string) {
    setVisiblePasswords((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }))
  }

  async function handleDeleteEntry(index: number) {
    const entry = entries[index]
    if (!entry) return

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar la cuenta "${entry.account || 'sin nombre'}"? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) return

    const nextEntries = entries.filter((_, i) => i !== index)

    setSavingPasswords(true)
    setStatus('Eliminando cuenta...')

    const result = await window.api.saveVault({ entries: nextEntries })

    setSavingPasswords(false)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo eliminar la cuenta.')
      return
    }

    setEntries(nextEntries)
    setVisiblePasswords((prev) => {
      const next = { ...prev }
      delete next[entry.id]
      return next
    })
    setStatus(`Cuenta eliminada: ${entry.account || 'sin nombre'}.`)
  }

  async function handleCopyPassword(entry: Entry) {
    await navigator.clipboard.writeText(entry.password)
    setStatus(`Contraseña copiada: ${entry.account || 'sin nombre'}`)
  }

  async function handleSaveCurrentNote(): Promise<boolean> {
    if (!noteDraft) return false

    const normalizedTitle = noteDraft.title.trim()
    const normalizedContent = noteDraft.content

    const nextNote: Note = {
      ...noteDraft,
      title: normalizedTitle,
      content: normalizedContent,
    }

    const exists = notes.some((note) => note.id === nextNote.id)

    const nextNotes = exists
      ? notes.map((note) => (note.id === nextNote.id ? nextNote : note))
      : [nextNote, ...notes]

    setNotes(nextNotes)
    setSelectedNoteId(nextNote.id)
    setNoteDraft(nextNote)

    setSavingNotes(true)
    setStatus('Guardando anotación cifrada...')

    const result = await window.api.saveNotes({ notes: nextNotes })

    setSavingNotes(false)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo guardar la anotación.')
      return false
    }

    setStatus('Anotación guardada.')
    return true
  }

  function discardCurrentNoteChanges() {
    const saved = savedSelectedNote

    if (saved) {
      setSelectedNoteId(saved.id)
      setNoteDraft({ ...saved })
      setStatus('Cambios descartados.')
      return
    }

    const fallback = notes[0] ?? null

    setSelectedNoteId(fallback?.id ?? null)
    setNoteDraft(fallback ? { ...fallback } : null)
    setStatus('Cambios descartados.')
  }

  async function handleDeleteCurrentNote() {
    if (!selectedNoteId) return

    const confirmed = window.confirm(
      '¿Seguro que querés eliminar esta anotación? Esta acción no se puede deshacer.',
    )

    if (!confirmed) return

    const nextNotes = notes.filter((note) => note.id !== selectedNoteId)

    let nextSelectedId: string | null = null

    if (nextNotes.length > 0) {
      const deletedIndex = notes.findIndex((note) => note.id === selectedNoteId)
      const fallbackIndex = Math.max(0, deletedIndex - 1)
      nextSelectedId = nextNotes[Math.min(fallbackIndex, nextNotes.length - 1)]?.id ?? null
    }

    setNotes(nextNotes)
    setSelectedNoteId(nextSelectedId)
    setNoteDraft(
      nextSelectedId ? { ...(nextNotes.find((n) => n.id === nextSelectedId) as Note) } : null,
    )

    setSavingNotes(true)
    setStatus('Eliminando anotación...')

    const result = await window.api.saveNotes({ notes: nextNotes })

    setSavingNotes(false)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo eliminar la anotación.')
      return
    }

    setStatus('Anotación eliminada.')
  }

  async function handleLogout() {
    if (view === 'notes' && noteHasUnsavedChanges) {
      const confirmed = window.confirm(
        'Tenés cambios sin guardar en la anotación actual. ¿Seguro que querés cerrar sesión?',
      )

      if (!confirmed) return
    }

    await window.api.logout()
    setView('auth')
    setEntries([])
    setNotes([])
    setSelectedNoteId(null)
    setNoteDraft(null)
    setNotesSearch('')
    setUnsavedPromptAction(null)
    setPendingNoteSelectionId(null)
    setLoginUsername('')
    setLoginPassword('')
    setUnlockPassword('')
    setShowPasswords(false)
    setVisiblePasswords({})
    setStatus('Sesión cerrada.')
  }

  async function handleDeleteCurrentUser() {
    if (view === 'notes' && noteHasUnsavedChanges) {
      const confirmedUnsaved = window.confirm(
        'Tenés cambios sin guardar en la anotación actual. ¿Querés continuar igual con la eliminación del usuario?',
      )

      if (!confirmedUnsaved) return
    }

    const confirmed = window.confirm(
      '¿Seguro que querés eliminar este usuario? También se eliminarán su vault cifrado y sus anotaciones cifradas, y no se podrán recuperar.',
    )

    if (!confirmed) return

    setStatus('Eliminando usuario...')

    const result = await window.api.deleteCurrentUser()

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudo eliminar el usuario.')
      return
    }

    setView('auth')
    setEntries([])
    setNotes([])
    setSelectedNoteId(null)
    setNoteDraft(null)
    setNotesSearch('')
    setUnsavedPromptAction(null)
    setPendingNoteSelectionId(null)
    setLoginUsername('')
    setLoginPassword('')
    setUnlockPassword('')
    setShowPasswords(false)
    setVisiblePasswords({})
    setStatus(`Usuario eliminado: ${result.username ?? 'desconocido'}.`)
  }

  function updateEntry(index: number, patch: Partial<Entry>) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    )
  }

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        account: '',
        username: '',
        password: '',
      },
    ])
  }

  function createAndSelectNewNote() {
    const freshNote = createEmptyNote()
    setSelectedNoteId(freshNote.id)
    setNoteDraft(freshNote)
    setStatus('Nueva anotación lista para editar.')
  }

  function handleNewNote() {
    if (noteHasUnsavedChanges) {
      setPendingNoteSelectionId(null)
      setUnsavedPromptAction('new-note')
      return
    }

    createAndSelectNewNote()
  }

  function getNoteButtonLabel(note: Note, index: number) {
    const trimmed = note.title.trim()
    if (trimmed) return trimmed
    return `Sin título ${index + 1}`
  }

  function handleSelectNote(noteId: string) {
    if (noteId === selectedNoteId) return

    if (noteHasUnsavedChanges) {
      setPendingNoteSelectionId(noteId)
      setUnsavedPromptAction('switch-note')
      return
    }

    setSelectedNoteId(noteId)
  }

  function handleGoHomeRequest() {
    if (view === 'notes' && noteHasUnsavedChanges) {
      setUnsavedPromptAction('go-home')
      return
    }

    setView('home')
  }

  async function resolveUnsavedPrompt(decision: 'save' | 'discard' | 'cancel') {
    const action = unsavedPromptAction
    if (!action) return

    if (decision === 'cancel') {
      setUnsavedPromptAction(null)
      setPendingNoteSelectionId(null)

      if (action === 'close-app') {
        await window.api.cancelCloseAfterPrompt()
      }

      return
    }

    if (decision === 'save') {
      const ok = await handleSaveCurrentNote()

      if (!ok) {
        if (action === 'close-app') {
          await window.api.cancelCloseAfterPrompt()
        }
        setUnsavedPromptAction(null)
        setPendingNoteSelectionId(null)
        return
      }
    }

    if (decision === 'discard') {
      discardCurrentNoteChanges()
    }

    const pendingId = pendingNoteSelectionId

    setUnsavedPromptAction(null)
    setPendingNoteSelectionId(null)

    if (action === 'go-home') {
      setView('home')
      return
    }

    if (action === 'close-app') {
      await window.api.confirmCloseAfterPrompt()
      return
    }

    if (action === 'switch-note') {
      if (pendingId) {
        setSelectedNoteId(pendingId)
      }
      return
    }

    if (action === 'new-note') {
      createAndSelectNewNote()
    }
  }

  const selectedNoteExistsInSavedList = selectedNoteId
    ? notes.some((note) => note.id === selectedNoteId)
    : false

  const promptTitle =
    unsavedPromptAction === 'close-app'
      ? 'Hay cambios sin guardar antes de cerrar la aplicación'
      : unsavedPromptAction === 'go-home'
        ? 'Hay cambios sin guardar antes de volver al inicio'
        : unsavedPromptAction === 'switch-note'
          ? 'Hay cambios sin guardar antes de abrir otra anotación'
          : 'Hay cambios sin guardar antes de crear una nueva anotación'

  const promptDescription =
    unsavedPromptAction === 'close-app'
      ? 'La anotación actual tiene cambios sin guardar. Podés guardar y salir, salir sin guardar, o cancelar.'
      : unsavedPromptAction === 'go-home'
        ? 'La anotación actual tiene cambios sin guardar. Podés guardar e ir al inicio, ir al inicio sin guardar, o cancelar.'
        : unsavedPromptAction === 'switch-note'
          ? 'La anotación actual tiene cambios sin guardar. Podés guardar y abrir la otra anotación, abrir la otra anotación sin guardar, o cancelar.'
          : 'La anotación actual tiene cambios sin guardar. Podés guardar y crear una nueva anotación, crear una nueva sin guardar, o cancelar.'

  const promptPrimaryLabel =
    unsavedPromptAction === 'close-app'
      ? 'Guardar y salir'
      : unsavedPromptAction === 'go-home'
        ? 'Guardar e ir al inicio'
        : unsavedPromptAction === 'switch-note'
          ? 'Guardar y abrir otra'
          : 'Guardar y crear nueva'

  const promptSecondaryLabel =
    unsavedPromptAction === 'close-app'
      ? 'Salir sin guardar'
      : unsavedPromptAction === 'go-home'
        ? 'Ir al inicio sin guardar'
        : unsavedPromptAction === 'switch-note'
          ? 'Abrir otra sin guardar'
          : 'Crear nueva sin guardar'

  if (view === 'auth') {
    return (
      <AuthView
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        registerUsername={registerUsername}
        setRegisterUsername={setRegisterUsername}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        registerPasswordConfirm={registerPasswordConfirm}
        setRegisterPasswordConfirm={setRegisterPasswordConfirm}
        registerVaultPassword={registerVaultPassword}
        setRegisterVaultPassword={setRegisterVaultPassword}
        registerVaultPasswordConfirm={registerVaultPasswordConfirm}
        setRegisterVaultPasswordConfirm={setRegisterVaultPasswordConfirm}
        status={status}
        onLogin={handleLogin}
        onCreateUser={handleCreateUser}
      />
    )
  }

  if (view === 'unlock') {
    return (
      <UnlockView
        unlockPassword={unlockPassword}
        setUnlockPassword={setUnlockPassword}
        status={status}
        onUnlock={handleUnlockVault}
        onBack={handleLogout}
      />
    )
  }

  if (view === 'home') {
    return (
      <HomeView
        status={status}
        onOpenPasswords={() => setView('passwords')}
        onOpenNotes={() => setView('notes')}
        onDeleteUser={() => void handleDeleteCurrentUser()}
        onLogout={() => void handleLogout()}
      />
    )
  }

  if (view === 'passwords') {
    return (
      <PasswordsView
        entries={entries}
        totalEntries={totalEntries}
        savingPasswords={savingPasswords}
        showPasswords={showPasswords}
        visiblePasswords={visiblePasswords}
        status={status}
        onGoHome={() => setView('home')}
        onToggleShowPasswords={() => setShowPasswords((v) => !v)}
        onAddEntry={addEntry}
        onSave={() => void handleSavePasswords()}
        onLogout={() => void handleLogout()}
        onUpdateEntry={updateEntry}
        onCopyPassword={(entry) => void handleCopyPassword(entry)}
        onDeleteEntry={(index) => void handleDeleteEntry(index)}
        onToggleEntryPassword={toggleEntryPassword}
      />
    )
  }

  return (
    <>
      <NotesView
        totalNotes={totalNotes}
        status={status}
        notesSearch={notesSearch}
        setNotesSearch={setNotesSearch}
        noteHasUnsavedChanges={noteHasUnsavedChanges}
        filteredNotes={filteredNotes}
        selectedNoteId={selectedNoteId}
        notes={notes}
        noteDraft={noteDraft}
        selectedNoteExistsInSavedList={selectedNoteExistsInSavedList}
        savingNotes={savingNotes}
        onGoHome={handleGoHomeRequest}
        onNewNote={handleNewNote}
        onDiscardChanges={discardCurrentNoteChanges}
        onSaveNote={() => void handleSaveCurrentNote()}
        onDeleteNote={() => void handleDeleteCurrentNote()}
        onLogout={() => void handleLogout()}
        onSelectNote={handleSelectNote}
        setNoteDraft={setNoteDraft}
        getNoteButtonLabel={getNoteButtonLabel}
      />

      <UnsavedChangesModal
        open={!!unsavedPromptAction}
        title={promptTitle}
        description={promptDescription}
        primaryLabel={promptPrimaryLabel}
        secondaryLabel={promptSecondaryLabel}
        onSave={() => void resolveUnsavedPrompt('save')}
        onDiscard={() => void resolveUnsavedPrompt('discard')}
        onCancel={() => void resolveUnsavedPrompt('cancel')}
      />
    </>
  )
}