//src/components/views/NotesView.tsx
import { Home, LogOut, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { Note } from '../../types/app-types'
import {
    appShellStyle,
    emptySidebarStyle,
    emptyStateStyle,
    inputStyle,
    labelStyle,
    noteButtonMetaStyle,
    noteButtonTitleStyle,
    noteEditorCardStyle,
    noteListButtonActiveStyle,
    noteListButtonStyle,
    noteMetaStyle,
    notesButtonsListStyle,
    notesEditorStyle,
    notesLayoutStyle,
    notesSidebarHeaderRowStyle,
    notesSidebarHeaderStyle,
    notesSidebarStyle,
    pageStyle,
    savedBadgeStyle,
    searchInputStyle,
    statusBoxStyle,
    textareaStyle,
    toolbarButtonsStyle,
    toolbarStyle,
    unsavedBadgeStyle,
} from '../../styles/appStyles'
import { IconButton } from '../IconButton'

type NotesViewProps = {
    totalNotes: number
    status: string
    notesSearch: string
    setNotesSearch: Dispatch<SetStateAction<string>>
    noteHasUnsavedChanges: boolean
    filteredNotes: Note[]
    selectedNoteId: string | null
    notes: Note[]
    noteDraft: Note | null
    selectedNoteExistsInSavedList: boolean
    savingNotes: boolean
    onGoHome: () => void
    onNewNote: () => void
    onDiscardChanges: () => void
    onSaveNote: () => void
    onDeleteNote: () => void
    onLogout: () => void
    onSelectNote: (noteId: string) => void
    setNoteDraft: Dispatch<SetStateAction<Note | null>>
    getNoteButtonLabel: (note: Note, index: number) => string
}

export function NotesView({
    totalNotes,
    status,
    notesSearch,
    setNotesSearch,
    noteHasUnsavedChanges,
    filteredNotes,
    selectedNoteId,
    notes,
    noteDraft,
    selectedNoteExistsInSavedList,
    savingNotes,
    onGoHome,
    onNewNote,
    onDiscardChanges,
    onSaveNote,
    onDeleteNote,
    onLogout,
    onSelectNote,
    setNoteDraft,
    getNoteButtonLabel,
}: NotesViewProps) {
    return (
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
                        <IconButton title="Inicio" onClick={onGoHome}>
                            <Home size={16} />
                        </IconButton>

                        <IconButton title="Nueva anotación" onClick={onNewNote}>
                            <Plus size={16} />
                        </IconButton>

                        <IconButton
                            title="Descartar cambios"
                            onClick={onDiscardChanges}
                            disabled={!noteHasUnsavedChanges}
                        >
                            <RotateCcw size={16} />
                        </IconButton>

                        <IconButton
                            title="Guardar anotación"
                            onClick={onSaveNote}
                            disabled={savingNotes || !noteDraft}
                        >
                            <Save size={16} />
                        </IconButton>

                        <IconButton
                            title="Eliminar anotación"
                            onClick={onDeleteNote}
                            disabled={!selectedNoteId}
                            danger
                        >
                            <Trash2 size={16} />
                        </IconButton>

                        <IconButton title="Cerrar sesión" onClick={onLogout} danger>
                            <LogOut size={16} />
                        </IconButton>
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
                                            onClick={() => onSelectNote(note.id)}
                                        >
                                            <div style={noteButtonTitleStyle}>{getNoteButtonLabel(note, index)}</div>
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
                                        setNoteDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                                    }
                                    placeholder="Título de la anotación"
                                />

                                <label style={labelStyle}>Texto</label>
                                <textarea
                                    style={textareaStyle}
                                    value={noteDraft.content}
                                    onChange={(e) =>
                                        setNoteDraft((prev) => (prev ? { ...prev, content: e.target.value } : prev))
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
    )
}