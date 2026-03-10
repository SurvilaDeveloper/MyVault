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

  const [status, setStatus] = useState('Listo')
  const [savingPasswords, setSavingPasswords] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

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
      setStatus('Anotaciones cargadas.')
    })()
  }, [view])

  const totalEntries = useMemo(() => entries.length, [entries])
  const totalNotes = useMemo(() => notes.length, [notes])

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

  async function handleSaveNotes() {
    setSavingNotes(true)
    setStatus('Guardando anotaciones cifradas...')

    const result = await window.api.saveNotes({ notes })

    setSavingNotes(false)

    if (!result.ok) {
      setStatus(result.error ?? 'No se pudieron guardar las anotaciones.')
      return
    }

    setStatus('Anotaciones guardadas.')
  }

  async function handleLogout() {
    await window.api.logout()
    setView('auth')
    setEntries([])
    setNotes([])
    setLoginUsername('')
    setLoginPassword('')
    setUnlockPassword('')
    setStatus('Sesión cerrada.')
  }

  async function handleDeleteCurrentUser() {
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

  function updateNote(index: number, patch: Partial<Note>) {
    setNotes((prev) => prev.map((note, i) => (i === index ? { ...note, ...patch } : note)))
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index))
  }

  function addNote() {
    setNotes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        content: '',
      },
    ])
  }

  if (view === 'auth') {
    return (
      <div style={pageStyle}>
        <div style={authWrapperStyle}>
          <div style={heroStyle}>
            <h1 style={titleStyle}>Gestor de contraseñas</h1>
            <p style={subtitleStyle}>
              Login para entrar a la app. Master password aparte para desbloquear el
              vault.
            </p>
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
            <button style={ghostButtonStyle} onClick={() => setView('home')}>
              Inicio
            </button>
            <button style={secondaryButtonStyle} onClick={addNote}>
              Agregar anotación
            </button>
            <button style={primaryButtonStyle} onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? 'Guardando...' : 'Guardar'}
            </button>
            <button style={dangerButtonStyle} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div style={notesListStyle}>
          {notes.length === 0 ? (
            <div style={emptyStateStyle}>
              No hay anotaciones todavía. Agregá la primera.
            </div>
          ) : (
            notes.map((note, i) => (
              <section key={note.id} style={noteCardStyle}>
                <label style={labelStyle}>Título</label>
                <input
                  style={inputStyle}
                  value={note.title}
                  onChange={(e) => updateNote(i, { title: e.target.value })}
                  placeholder="Título de la anotación"
                />

                <label style={labelStyle}>Texto</label>
                <textarea
                  style={textareaStyle}
                  value={note.content}
                  onChange={(e) => updateNote(i, { content: e.target.value })}
                  placeholder="Escribí tu anotación privada..."
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button style={dangerButtonStyle} onClick={() => removeNote(i)}>
                    Eliminar
                  </button>
                </div>
              </section>
            ))
          )}
        </div>

        <div style={statusBoxStyle}>{status}</div>
      </div>
    </div>
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

const noteCardStyle: CSSProperties = {
  background: '#f8fafc',
  borderRadius: 16,
  padding: 18,
  border: '1px solid #e6ebf3',
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

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 180,
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

const notesListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
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