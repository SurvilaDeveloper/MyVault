//src/components/views/PasswordsView.tsx
import { Check, Copy, Eye, EyeOff, Home, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import type { Entry } from '../../types/app-types'
import {
    appShellStyle,
    emptyStateStyle,
    inputStyle,
    listStyle,
    pageStyle,
    rowStyle4,
    statusBoxStyle,
    tableHeaderStyle,
    toolbarButtonsStyle,
    toolbarStyle,
} from '../../styles/appStyles'
import { IconButton } from '../IconButton'

type PasswordsViewProps = {
    entries: Entry[]
    totalEntries: number
    savingPasswords: boolean
    showPasswords: boolean
    visiblePasswords: Record<string, boolean>
    copiedEntryId: string | null
    status: string
    onGoHome: () => void
    onToggleShowPasswords: () => void
    onAddEntry: () => void
    onSave: () => void
    onLogout: () => void
    onUpdateEntry: (index: number, patch: Partial<Entry>) => void
    onCopyPassword: (entry: Entry) => void
    onDeleteEntry: (index: number) => void
    onToggleEntryPassword: (entryId: string) => void
}

export function PasswordsView({
    entries,
    totalEntries,
    savingPasswords,
    showPasswords,
    visiblePasswords,
    copiedEntryId,
    status,
    onGoHome,
    onToggleShowPasswords,
    onAddEntry,
    onSave,
    onLogout,
    onUpdateEntry,
    onCopyPassword,
    onDeleteEntry,
    onToggleEntryPassword,
}: PasswordsViewProps) {
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
                        <IconButton title="Inicio" onClick={onGoHome}>
                            <Home size={16} />
                        </IconButton>

                        <IconButton
                            title={showPasswords ? 'Ocultar todas las claves' : 'Mostrar todas las claves'}
                            onClick={onToggleShowPasswords}
                            disabled={savingPasswords}
                        >
                            {showPasswords ? <EyeOff size={16} color='white' /> : <Eye size={16} color='white' />}
                        </IconButton>

                        <IconButton
                            title="Agregar cuenta"
                            onClick={onAddEntry}
                            disabled={savingPasswords}
                        >
                            <Plus size={16} />
                        </IconButton>

                        <IconButton title="Guardar cambios" onClick={onSave} disabled={savingPasswords}>
                            <Save size={16} />
                        </IconButton>

                        <IconButton title="Cerrar sesión" onClick={onLogout} danger>
                            <LogOut size={16} />
                        </IconButton>
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
                        entries.map((entry, i) => {
                            const isVisible = showPasswords || !!visiblePasswords[entry.id]
                            const isCopied = copiedEntryId === entry.id

                            return (
                                <div key={entry.id} style={rowStyle4}>
                                    <input
                                        style={inputStyle}
                                        value={entry.account}
                                        onChange={(e) => onUpdateEntry(i, { account: e.target.value })}
                                        placeholder="Ej: github"
                                    />

                                    <input
                                        style={inputStyle}
                                        value={entry.username}
                                        onChange={(e) => onUpdateEntry(i, { username: e.target.value })}
                                        placeholder="Usuario o email"
                                    />

                                    <input
                                        style={inputStyle}
                                        type={isVisible ? 'text' : 'password'}
                                        value={entry.password}
                                        onChange={(e) => onUpdateEntry(i, { password: e.target.value })}
                                        placeholder="Contraseña"
                                    />

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <IconButton
                                            title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            onClick={() => onToggleEntryPassword(entry.id)}
                                        >
                                            {isVisible ? <EyeOff size={16} color='white' /> : <Eye size={16} color='white' />}
                                        </IconButton>

                                        <IconButton
                                            title={isCopied ? 'Contraseña copiada' : 'Copiar contraseña'}
                                            onClick={() => onCopyPassword(entry)}
                                        >
                                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                        </IconButton>

                                        <IconButton
                                            title="Eliminar cuenta"
                                            onClick={() => onDeleteEntry(i)}
                                            disabled={savingPasswords}
                                            danger
                                        >
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div style={statusBoxStyle}>{status}</div>
            </div>
        </div>
    )
}