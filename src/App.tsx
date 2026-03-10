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

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
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
      <div style={pageStyle}>
        <div style={authWrapperStyle}>
          <div style={heroStyle}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'start',
              alignItems: 'center'
            }}>
              <img src="/icon128.png" alt="Logo de MyVault de 128 x 128" />
              <h1 style={titleStyle}>MyVault</h1>

            </div>

            {/*<p style={subtitleStyle}>
              Login para entrar a la app. Master password aparte para desbloquear el
              vault.
            </p>*/}
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
        <div style={{ ...authWrapperStyle, maxWidth: 520 }}>
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

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
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
        <div style={{ ...authWrapperStyle, maxWidth: 820 }}>
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

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
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
              <h1 style={{ margin: 0, fontSize: 28 }}>Vault de contraseñas</h1>
              <div style={{ marginTop: 6, color: '#5b6472' }}>
                {totalEntries} {totalEntries === 1 ? 'cuenta' : 'cuentas'}
              </div>
            </div>

            <div style={toolbarButtonsStyle}>
              <button style={ghostButtonStyle} onClick={() => setView('home')}>
                Inicio
              </button>
              <button style={ghostButtonStyle} onClick={() => setShowPasswords((v) => !v)}>
                {showPasswords ? 'Ocultar claves' : 'Mostrar claves'}
              </button>
              <button style={secondaryButtonStyle} onClick={addEntry}>
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
                    <button style={dangerButtonStyle} onClick={() => removeEntry(i)}>
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
              <h1 style={{ margin: 0, fontSize: 28 }}>Anotaciones privadas</h1>
              <div style={{ marginTop: 6, color: '#5b6472' }}>
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
  background: 'linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%)',
  fontFamily: 'Inter, Arial, sans-serif',
  color: '#18202a',
  padding: 24,
  boxSizing: 'border-box',
}

const authWrapperStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
}

const heroStyle: CSSProperties = {
  marginBottom: 24,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 700,
}

const subtitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 16,
  color: '#5b6472',
}

const authGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
}

const homeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 22,
  boxShadow: '0 12px 30px rgba(20, 30, 50, 0.08)',
  border: '1px solid #e4e9f2',
}

const homeCardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 24,
  boxShadow: '0 12px 30px rgba(20, 30, 50, 0.08)',
  border: '1px solid #e4e9f2',
}

const cardTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 18,
  fontSize: 22,
}

const homeCardTextStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  color: '#5b6472',
  lineHeight: 1.5,
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  marginTop: 10,
  fontSize: 14,
  fontWeight: 600,
  color: '#3b4555',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #ced6e3',
  fontSize: 15,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #ced6e3',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  marginBottom: 14,
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 320,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #ced6e3',
  fontSize: 15,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

const primaryButtonStyle: CSSProperties = {
  marginTop: 16,
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 600,
  background: '#1f6feb',
  color: '#fff',
}

const secondaryButtonStyle: CSSProperties = {
  marginTop: 16,
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #cfd7e6',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 600,
  background: '#fff',
  color: '#1f2937',
}

const ghostButtonStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #d7deea',
  cursor: 'pointer',
  fontSize: 14,
  background: '#fff',
  color: '#243041',
}

const dangerButtonStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  background: '#d92d20',
  color: '#fff',
}

const statusBoxStyle: CSSProperties = {
  marginTop: 18,
  background: '#fff',
  border: '1px solid #e1e7f0',
  borderRadius: 14,
  padding: '14px 16px',
  color: '#445065',
  boxShadow: '0 8px 20px rgba(20, 30, 50, 0.04)',
}

const appShellStyle: CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 14px 36px rgba(20, 30, 50, 0.08)',
  border: '1px solid #e4e9f2',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 24,
}

const toolbarButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const tableHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 220px',
  gap: 14,
  fontSize: 13,
  fontWeight: 700,
  color: '#576173',
  marginBottom: 10,
  padding: '0 4px',
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const rowStyle4: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 220px',
  gap: 14,
  alignItems: 'center',
  padding: 12,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e6ebf3',
}

const emptyStateStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px dashed #cfd8e5',
  color: '#5e6a7b',
}

const notesLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: 20,
  alignItems: 'start',
}

const notesSidebarStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e6ebf3',
  borderRadius: 18,
  padding: 16,
  minHeight: 460,
}

const notesSidebarHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 12,
}

const notesSidebarHeaderStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#435066',
}

const unsavedBadgeStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#9a6700',
  background: '#fff4d6',
  border: '1px solid #f0d48a',
  borderRadius: 999,
  padding: '4px 8px',
  whiteSpace: 'nowrap',
}

const savedBadgeStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#137333',
  background: '#e7f6ec',
  border: '1px solid #b7e1c3',
  borderRadius: 999,
  padding: '4px 8px',
  whiteSpace: 'nowrap',
}

const notesButtonsListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const noteListButtonStyle: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #d9e2ef',
  background: '#fff',
  color: '#1f2937',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
}

const noteListButtonActiveStyle: CSSProperties = {
  border: '1px solid #1f6feb',
  background: '#eaf2ff',
  color: '#114aa3',
}

const noteButtonTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.35,
  marginBottom: 4,
  wordBreak: 'break-word',
}

const noteButtonMetaStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#667085',
}

const notesEditorStyle: CSSProperties = {
  minWidth: 0,
}

const noteEditorCardStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e6ebf3',
  borderRadius: 18,
  padding: 18,
}

const noteMetaStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#5b6472',
  marginBottom: 8,
}

const emptySidebarStyle: CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: '#fff',
  border: '1px dashed #d7deea',
  color: '#5e6a7b',
  fontSize: 14,
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 9999,
}

const modalCardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
  border: '1px solid #e5e7eb',
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: '#111827',
}

const modalTextStyle: CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  color: '#4b5563',
  lineHeight: 1.6,
}

const modalButtonsStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 22,
}