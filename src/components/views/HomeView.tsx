//src/components/views/HomeView.tsx
import { useState } from 'react'
import {
    authWrapperStyle,
    cardTitleStyle,
    dangerButtonStyle,
    ghostButtonStyle,
    heroStyle,
    homeCardStyle,
    homeCardTextStyle,
    homeGridStyle,
    inputStyle,
    labelStyle,
    modalButtonsStyle,
    modalCardStyle,
    modalOverlayStyle,
    modalTextStyle,
    modalTitleStyle,
    pageStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    statusBoxStyle,
    subtitleStyle,
    titleStyle,
} from '../../styles/appStyles'

type HomeViewProps = {
    status: string
    onOpenPasswords: () => void
    onOpenNotes: () => void
    onDeleteUser: () => void
    onLogout: () => void
    onStatusChange?: (message: string) => void
}

export function HomeView({
    status,
    onOpenPasswords,
    onOpenNotes,
    onDeleteUser,
    onLogout,
    onStatusChange,
}: HomeViewProps) {
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [repeatNewPassword, setRepeatNewPassword] = useState('')
    const [passwordStatus, setPasswordStatus] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    function resetChangePasswordModal() {
        setCurrentPassword('')
        setNewPassword('')
        setRepeatNewPassword('')
        setPasswordStatus('')
        setIsChangingPassword(false)
    }

    function openChangePasswordModal() {
        resetChangePasswordModal()
        setIsChangePasswordModalOpen(true)
    }

    function closeChangePasswordModal() {
        if (isChangingPassword) return
        resetChangePasswordModal()
        setIsChangePasswordModalOpen(false)
    }

    async function handleChangeLoginPassword() {
        const trimmedCurrentPassword = currentPassword.trim()
        const trimmedNewPassword = newPassword.trim()
        const trimmedRepeatNewPassword = repeatNewPassword.trim()

        if (!trimmedCurrentPassword) {
            setPasswordStatus('Ingresá tu contraseña actual.')
            return
        }

        if (!trimmedNewPassword) {
            setPasswordStatus('Ingresá una nueva contraseña.')
            return
        }

        if (trimmedNewPassword.length < 4) {
            setPasswordStatus('La nueva contraseña debe tener al menos 4 caracteres.')
            return
        }

        if (!trimmedRepeatNewPassword) {
            setPasswordStatus('Repetí la nueva contraseña.')
            return
        }

        if (trimmedNewPassword !== trimmedRepeatNewPassword) {
            setPasswordStatus('La repetición de la nueva contraseña no coincide.')
            return
        }

        if (trimmedCurrentPassword === trimmedNewPassword) {
            setPasswordStatus('La nueva contraseña no puede ser igual a la actual.')
            return
        }

        setIsChangingPassword(true)
        setPasswordStatus('')

        try {
            const result = await window.api.changeLoginPassword(
                trimmedCurrentPassword,
                trimmedNewPassword,
            )

            if (!result.ok) {
                setPasswordStatus(result.error ?? 'No se pudo cambiar la contraseña.')
                return
            }

            onStatusChange?.('La contraseña de login se cambió correctamente.')
            closeChangePasswordModal()
        } catch (error) {
            setPasswordStatus(
                error instanceof Error
                    ? error.message
                    : 'No se pudo cambiar la contraseña.',
            )
        } finally {
            setIsChangingPassword(false)
        }
    }

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
                        <button style={primaryButtonStyle} onClick={onOpenPasswords}>
                            Contraseñas
                        </button>
                    </section>

                    <section style={homeCardStyle}>
                        <h2 style={cardTitleStyle}>Anotaciones</h2>
                        <p style={homeCardTextStyle}>
                            Guardá notas privadas con título y texto en un archivo cifrado separado.
                        </p>
                        <button style={secondaryButtonStyle} onClick={onOpenNotes}>
                            Anotaciones
                        </button>
                    </section>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    <button style={secondaryButtonStyle} onClick={openChangePasswordModal}>
                        Cambiar contraseña de login
                    </button>
                    <button style={dangerButtonStyle} onClick={onDeleteUser}>
                        Eliminar usuario
                    </button>
                    <button style={ghostButtonStyle} onClick={onLogout}>
                        Cerrar sesión
                    </button>
                </div>

                <div style={statusBoxStyle}>{status}</div>
            </div>

            {isChangePasswordModalOpen ? (
                <div
                    style={modalOverlayStyle}
                    onClick={closeChangePasswordModal}
                >
                    <div
                        style={{ ...modalCardStyle, maxWidth: 520 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 style={modalTitleStyle}>Cambiar contraseña de login</h2>
                        <p style={modalTextStyle}>
                            Esta contraseña se usa para iniciar sesión. No modifica el cifrado del
                            vault.
                        </p>

                        <label style={labelStyle} htmlFor="change-login-current-password">
                            Contraseña actual
                        </label>
                        <input
                            id="change-login-current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            style={inputStyle}
                            autoComplete="current-password"
                            disabled={isChangingPassword}
                        />

                        <label style={labelStyle} htmlFor="change-login-new-password">
                            Nueva contraseña
                        </label>
                        <input
                            id="change-login-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            style={inputStyle}
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                        />

                        <label style={labelStyle} htmlFor="change-login-repeat-password">
                            Repetir nueva contraseña
                        </label>
                        <input
                            id="change-login-repeat-password"
                            type="password"
                            value={repeatNewPassword}
                            onChange={(event) => setRepeatNewPassword(event.target.value)}
                            style={inputStyle}
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                        />

                        {passwordStatus ? (
                            <div style={{ ...statusBoxStyle, marginTop: 14 }}>
                                {passwordStatus}
                            </div>
                        ) : null}

                        <div style={modalButtonsStyle}>
                            <button
                                style={secondaryButtonStyle}
                                onClick={closeChangePasswordModal}
                                disabled={isChangingPassword}
                            >
                                Cancelar
                            </button>
                            <button
                                style={primaryButtonStyle}
                                onClick={handleChangeLoginPassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword
                                    ? 'Cambiando...'
                                    : 'Guardar nueva contraseña'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}