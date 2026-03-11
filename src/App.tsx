//src/App.tsx
import { useEffect, useMemo, useState, type CSSProperties } from 'react'

type View = 'auth' | 'unlock' | 'home' | 'passwords' | 'notes'

type Entry = {
  id: string
  account: string
  username: string
  password: string
}

type Note = {
  id: string
  title: string
  content: string
}

type UnsavedPromptAction =
  | 'go-home'
  | 'close-app'
  | 'switch-note'
  | 'new-note'

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
    setStatus(`Cuenta eliminada: ${entry.account || 'sin nombre'}.`)
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
    setStatus(`Usuario eliminado: ${result.username ?? 'desconocido'}.`)
  }

  function updateEntry(index: number, patch: Partial<Entry>) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    )
  }
  /*
    function removeEntry(index: number) {
      setEntries((prev) => prev.filter((_, i) => i !== index))
    }
  */
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
      <div style={pageStyle}>
        <div style={authWrapperStyle}>
          <div style={heroStyle}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'start',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <img
                src="/icon128.png"
                alt="Logo de MyVault de 128 x 128"
                style={{ width: 64, height: 64 }}
              />
              <h1 style={titleStyle}>MyVault</h1>
            </div>
          </div>

          <div style={authGridStyle}>
            <section style={cardStyle}>
              <h2 style={cardTitleStyle}>Iniciar sesión</h2>

              <label style={labelStyle}>Usuario</label>
              <input
                style={inputStyle}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Tu usuario"
              />

              <label style={labelStyle}>Contraseña de login</label>
              <input
                style={inputStyle}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Tu contraseña de login"
              />

              <button style={primaryButtonStyle} onClick={handleLogin}>
                Ingresar
              </button>
            </section>

            <section style={cardStyle}>
              <h2 style={cardTitleStyle}>Crear usuario</h2>

              <label style={labelStyle}>Nuevo usuario</label>
              <input
                style={inputStyle}
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                placeholder="Elegí un usuario"
              />

              <label style={labelStyle}>Contraseña de login</label>
              <input
                style={inputStyle}
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Elegí una contraseña de login"
              />

              <label style={labelStyle}>Confirmar contraseña de login</label>
              <input
                style={inputStyle}
                type="password"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                placeholder="Repetí la contraseña de login"
              />

              <label style={labelStyle}>Master password del vault</label>
              <input
                style={inputStyle}
                type="password"
                value={registerVaultPassword}
                onChange={(e) => setRegisterVaultPassword(e.target.value)}
                placeholder="Elegí una master password"
              />

              <label style={labelStyle}>Confirmar master password</label>
              <input
                style={inputStyle}
                type="password"
                value={registerVaultPasswordConfirm}
                onChange={(e) => setRegisterVaultPasswordConfirm(e.target.value)}
                placeholder="Repetí la master password"
              />

              <button style={secondaryButtonStyle} onClick={handleCreateUser}>
                Crear usuario
              </button>
            </section>
          </div>

          <div style={statusBoxStyle}>{status}</div>
        </div>
      </div>
    )
  }

  if (view === 'unlock') {
    return (
      <div style={pageStyle}>
        <div style={{ ...authWrapperStyle, maxWidth: 500 }}>
          <div style={heroStyle}>
            <h1 style={titleStyle}>Desbloquear vault</h1>
            <p style={subtitleStyle}>
              Ingresá la master password para descifrar tus datos guardados.
            </p>
          </div>

          <section style={cardStyle}>
            <label style={labelStyle}>Master password</label>
            <input
              style={inputStyle}
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Master password del vault"
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={primaryButtonStyle} onClick={handleUnlockVault}>
                Desbloquear
              </button>

              <button style={ghostButtonStyle} onClick={handleLogout}>
                Volver
              </button>
            </div>
          </section>

          <div style={statusBoxStyle}>{status}</div>
        </div>
      </div>
    )
  }

  if (view === 'home') {
    return (
      <div style={pageStyle}>
        <div style={{ ...authWrapperStyle, maxWidth: 780 }}>
          <div style={heroStyle}>
            <h1 style={titleStyle}>Panel principal</h1>
            <p style={subtitleStyle}>
              Elegí qué querés abrir. Ambos módulos se guardan cifrados.
            </p>
          </div>

          <div style={homeGridStyle}>
            <section style={homeCardStyle}>
              <h2 style={cardTitleStyle}>Contraseñas</h2>
              <p style={homeCardTextStyle}>
                Administrá cuentas, usuarios y claves guardadas en tu vault.
              </p>
              <button style={primaryButtonStyle} onClick={() => setView('passwords')}>
                Contraseñas
              </button>
            </section>

            <section style={homeCardStyle}>
              <h2 style={cardTitleStyle}>Anotaciones</h2>
              <p style={homeCardTextStyle}>
                Guardá notas privadas con título y texto en un archivo cifrado separado.
              </p>
              <button style={secondaryButtonStyle} onClick={() => setView('notes')}>
                Anotaciones
              </button>
            </section>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button style={dangerButtonStyle} onClick={handleDeleteCurrentUser}>
              Eliminar usuario
            </button>
            <button style={ghostButtonStyle} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>

          <div style={statusBoxStyle}>{status}</div>
        </div>
      </div>
    )
  }

  if (view === 'passwords') {
    return (
      <div style={pageStyle}>
        <div style={appShellStyle}>
          <div style={toolbarStyle}>
            <div>
              <h1 style={{ margin: 0, fontSize: 27, color: '#f8fafc' }}>Vault de contraseñas</h1>
              <div style={{ marginTop: 5, color: '#94a3b8', fontSize: 13 }}>
                {totalEntries} {totalEntries === 1 ? 'cuenta' : 'cuentas'}
              </div>
            </div>

            <div style={toolbarButtonsStyle}>
              <button style={ghostButtonStyle} onClick={() => setView('home')}>
                Inicio
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => setShowPasswords((v) => !v)}
                disabled={savingPasswords}
              >
                {showPasswords ? 'Ocultar claves' : 'Mostrar claves'}
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={addEntry}
                disabled={savingPasswords}
              >
                Agregar cuenta
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleSavePasswords}
                disabled={savingPasswords}
              >
                {savingPasswords ? 'Guardando...' : 'Guardar'}
              </button>
              <button style={dangerButtonStyle} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>

          <div style={tableHeaderStyle}>
            <div>Cuenta</div>
            <div>Usuario</div>
            <div>Contraseña</div>
            <div>Acciones</div>
          </div>

          <div style={listStyle}>
            {entries.length === 0 ? (
              <div style={emptyStateStyle}>No hay cuentas todavía. Agregá la primera.</div>
            ) : (
              entries.map((entry, i) => (
                <div key={entry.id} style={rowStyle4}>
                  <input
                    style={inputStyle}
                    value={entry.account}
                    onChange={(e) => updateEntry(i, { account: e.target.value })}
                    placeholder="Ej: github"
                  />

                  <input
                    style={inputStyle}
                    value={entry.username}
                    onChange={(e) => updateEntry(i, { username: e.target.value })}
                    placeholder="Usuario o email"
                  />

                  <input
                    style={inputStyle}
                    type={showPasswords ? 'text' : 'password'}
                    value={entry.password}
                    onChange={(e) => updateEntry(i, { password: e.target.value })}
                    placeholder="Contraseña"
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={ghostButtonStyle}
                      onClick={async () => {
                        await navigator.clipboard.writeText(entry.password)
                        setStatus(`Contraseña copiada: ${entry.account || 'sin nombre'}`)
                      }}
                    >
                      Copiar
                    </button>
                    <button
                      style={dangerButtonStyle}
                      onClick={() => void handleDeleteEntry(i)}
                      disabled={savingPasswords}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={statusBoxStyle}>{status}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={pageStyle}>
        <div style={appShellStyle}>
          <div style={toolbarStyle}>
            <div>
              <h1 style={{ margin: 0, fontSize: 27, color: '#f8fafc' }}>Anotaciones privadas</h1>
              <div style={{ marginTop: 5, color: '#94a3b8', fontSize: 13 }}>
                {totalNotes} {totalNotes === 1 ? 'anotación' : 'anotaciones'}
              </div>
            </div>

            <div style={toolbarButtonsStyle}>
              <button style={ghostButtonStyle} onClick={handleGoHomeRequest}>
                Inicio
              </button>
              <button style={secondaryButtonStyle} onClick={handleNewNote}>
                Nueva anotación
              </button>
              <button
                style={ghostButtonStyle}
                onClick={discardCurrentNoteChanges}
                disabled={!noteHasUnsavedChanges}
              >
                Descartar cambios
              </button>
              <button
                style={primaryButtonStyle}
                onClick={() => void handleSaveCurrentNote()}
                disabled={savingNotes || !noteDraft}
              >
                {savingNotes ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                style={dangerButtonStyle}
                onClick={() => void handleDeleteCurrentNote()}
                disabled={!selectedNoteId}
              >
                Eliminar
              </button>
              <button style={dangerButtonStyle} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>

          <div style={notesLayoutStyle}>
            <aside style={notesSidebarStyle}>
              <div style={notesSidebarHeaderRowStyle}>
                <div style={notesSidebarHeaderStyle}>Tus anotaciones</div>
                {noteHasUnsavedChanges ? (
                  <div style={unsavedBadgeStyle}>Sin guardar</div>
                ) : (
                  <div style={savedBadgeStyle}>Guardado</div>
                )}
              </div>

              <input
                style={searchInputStyle}
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                placeholder="Buscar por título..."
              />

              <div style={notesButtonsListStyle}>
                {filteredNotes.length === 0 ? (
                  <div style={emptySidebarStyle}>
                    {notesSearch.trim()
                      ? 'No hay anotaciones que coincidan con la búsqueda.'
                      : 'Todavía no hay anotaciones guardadas.'}
                  </div>
                ) : (
                  filteredNotes.map((note, index) => {
                    const isActive = note.id === selectedNoteId
                    const isDraftOnly = !notes.some((saved) => saved.id === note.id)

                    return (
                      <button
                        key={note.id}
                        style={{
                          ...noteListButtonStyle,
                          ...(isActive ? noteListButtonActiveStyle : null),
                        }}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <div style={noteButtonTitleStyle}>
                          {getNoteButtonLabel(note, index)}
                        </div>
                        <div style={noteButtonMetaStyle}>
                          {isDraftOnly ? 'Nueva' : 'Guardada'}
                          {isActive && noteHasUnsavedChanges ? ' · con cambios' : ''}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </aside>

            <section style={notesEditorStyle}>
              {!noteDraft ? (
                <div style={emptyStateStyle}>
                  Seleccioná una anotación o creá una nueva para empezar.
                </div>
              ) : (
                <div style={noteEditorCardStyle}>
                  <div style={noteMetaStyle}>
                    {selectedNoteExistsInSavedList ? 'Anotación guardada' : 'Nueva anotación'}
                    {noteHasUnsavedChanges
                      ? ' · cambios sin guardar'
                      : ' · sin cambios pendientes'}
                  </div>

                  <label style={labelStyle}>Título</label>
                  <input
                    style={inputStyle}
                    value={noteDraft.title}
                    onChange={(e) =>
                      setNoteDraft((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev,
                      )
                    }
                    placeholder="Título de la anotación"
                  />

                  <label style={labelStyle}>Texto</label>
                  <textarea
                    style={textareaStyle}
                    value={noteDraft.content}
                    onChange={(e) =>
                      setNoteDraft((prev) =>
                        prev ? { ...prev, content: e.target.value } : prev,
                      )
                    }
                    placeholder="Escribí tu anotación privada..."
                  />
                </div>
              )}
            </section>
          </div>

          <div style={statusBoxStyle}>{status}</div>
        </div>
      </div>

      {unsavedPromptAction ? (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h2 style={modalTitleStyle}>{promptTitle}</h2>
            <p style={modalTextStyle}>{promptDescription}</p>

            <div style={modalButtonsStyle}>
              <button
                style={primaryButtonStyle}
                onClick={() => void resolveUnsavedPrompt('save')}
              >
                {promptPrimaryLabel}
              </button>

              <button
                style={dangerButtonStyle}
                onClick={() => void resolveUnsavedPrompt('discard')}
              >
                {promptSecondaryLabel}
              </button>

              <button
                style={ghostButtonStyle}
                onClick={() => void resolveUnsavedPrompt('cancel')}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, #1e293b 0%, #0f172a 35%, #020617 100%)',
  fontFamily: 'Inter, Arial, sans-serif',
  color: '#e5e7eb',
  padding: 18,
  boxSizing: 'border-box',
}

const authWrapperStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
}

const heroStyle: CSSProperties = {
  marginBottom: 18,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 35,
  fontWeight: 700,
  color: '#f8fafc',
}

const subtitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 15,
  color: '#94a3b8',
}

const authGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const homeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const cardStyle: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.82)',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
  border: '1px solid #243041',
  backdropFilter: 'blur(10px)',
}

const homeCardStyle: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.82)',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
  border: '1px solid #243041',
  backdropFilter: 'blur(10px)',
}

const cardTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 21,
  color: '#f8fafc',
}

const homeCardTextStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  color: '#94a3b8',
  lineHeight: 1.45,
  fontSize: 14,
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  marginTop: 8,
  fontSize: 13,
  fontWeight: 600,
  color: '#cbd5e1',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #334155',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#0f172a',
  color: '#f8fafc',
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 10,
  border: '1px solid #334155',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#0f172a',
  color: '#f8fafc',
  marginBottom: 12,
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 280,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #334155',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#0f172a',
  color: '#f8fafc',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.45,
}

const primaryButtonStyle: CSSProperties = {
  marginTop: 14,
  padding: '10px 14px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  background: '#2563eb',
  color: '#fff',
}

const secondaryButtonStyle: CSSProperties = {
  marginTop: 14,
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #334155',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  background: '#111827',
  color: '#e5e7eb',
}

const ghostButtonStyle: CSSProperties = {
  padding: '9px 13px',
  borderRadius: 10,
  border: '1px solid #334155',
  cursor: 'pointer',
  fontSize: 13,
  background: '#0f172a',
  color: '#e2e8f0',
}

const dangerButtonStyle: CSSProperties = {
  padding: '9px 13px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  background: '#dc2626',
  color: '#fff',
}

const statusBoxStyle: CSSProperties = {
  marginTop: 14,
  background: 'rgba(15, 23, 42, 0.82)',
  border: '1px solid #243041',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#cbd5e1',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
  fontSize: 13,
}

const appShellStyle: CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  background: 'rgba(15, 23, 42, 0.86)',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 22px 50px rgba(0, 0, 0, 0.35)',
  border: '1px solid #243041',
  backdropFilter: 'blur(10px)',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  marginBottom: 18,
}

const toolbarButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const tableHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 220px',
  gap: 12,
  fontSize: 12,
  fontWeight: 700,
  color: '#94a3b8',
  marginBottom: 8,
  padding: '0 4px',
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const rowStyle4: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 220px',
  gap: 12,
  alignItems: 'center',
  padding: 10,
  borderRadius: 14,
  background: '#111827',
  border: '1px solid #243041',
}

const emptyStateStyle: CSSProperties = {
  padding: 18,
  textAlign: 'center',
  borderRadius: 14,
  background: '#0f172a',
  border: '1px dashed #334155',
  color: '#94a3b8',
  fontSize: 13,
}

const notesLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: 16,
  alignItems: 'start',
}

const notesSidebarStyle: CSSProperties = {
  background: '#111827',
  border: '1px solid #243041',
  borderRadius: 16,
  padding: 14,
  minHeight: 420,
}

const notesSidebarHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 10,
}

const notesSidebarHeaderStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#cbd5e1',
}

const unsavedBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#fbbf24',
  background: 'rgba(251, 191, 36, 0.14)',
  border: '1px solid rgba(251, 191, 36, 0.35)',
  borderRadius: 999,
  padding: '3px 7px',
  whiteSpace: 'nowrap',
}

const savedBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#4ade80',
  background: 'rgba(74, 222, 128, 0.12)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  borderRadius: 999,
  padding: '3px 7px',
  whiteSpace: 'nowrap',
}

const notesButtonsListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const noteListButtonStyle: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#e5e7eb',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}

const noteListButtonActiveStyle: CSSProperties = {
  border: '1px solid #3b82f6',
  background: 'rgba(59, 130, 246, 0.14)',
  color: '#bfdbfe',
}

const noteButtonTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.3,
  marginBottom: 3,
  wordBreak: 'break-word',
}

const noteButtonMetaStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#94a3b8',
}

const notesEditorStyle: CSSProperties = {
  minWidth: 0,
}

const noteEditorCardStyle: CSSProperties = {
  background: '#111827',
  border: '1px solid #243041',
  borderRadius: 16,
  padding: 14,
}

const noteMetaStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#94a3b8',
  marginBottom: 6,
}

const emptySidebarStyle: CSSProperties = {
  padding: 12,
  borderRadius: 10,
  background: '#0f172a',
  border: '1px dashed #334155',
  color: '#94a3b8',
  fontSize: 13,
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2, 6, 23, 0.68)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
  zIndex: 9999,
}

const modalCardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 500,
  background: '#0f172a',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
  border: '1px solid #243041',
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 21,
  fontWeight: 700,
  color: '#f8fafc',
}

const modalTextStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  color: '#cbd5e1',
  lineHeight: 1.5,
  fontSize: 14,
}

const modalButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
}