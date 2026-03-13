//src/components/views/AuthView.tsx
import { useState, type Dispatch, type SetStateAction } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
    authGridStyle,
    authWrapperStyle,
    cardStyle,
    cardTitleStyle,
    heroStyle,
    inputStyle,
    labelStyle,
    pageStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    statusBoxStyle,
    titleStyle,
} from '../../styles/appStyles'

type AuthViewProps = {
    loginUsername: string
    setLoginUsername: Dispatch<SetStateAction<string>>
    loginPassword: string
    setLoginPassword: Dispatch<SetStateAction<string>>
    registerUsername: string
    setRegisterUsername: Dispatch<SetStateAction<string>>
    registerPassword: string
    setRegisterPassword: Dispatch<SetStateAction<string>>
    registerPasswordConfirm: string
    setRegisterPasswordConfirm: Dispatch<SetStateAction<string>>
    registerVaultPassword: string
    setRegisterVaultPassword: Dispatch<SetStateAction<string>>
    registerVaultPasswordConfirm: string
    setRegisterVaultPasswordConfirm: Dispatch<SetStateAction<string>>
    status: string
    onLogin: () => void
    onCreateUser: () => void
}

export function AuthView(props: AuthViewProps) {
    const {
        loginUsername,
        setLoginUsername,
        loginPassword,
        setLoginPassword,
        registerUsername,
        setRegisterUsername,
        registerPassword,
        setRegisterPassword,
        registerPasswordConfirm,
        setRegisterPasswordConfirm,
        registerVaultPassword,
        setRegisterVaultPassword,
        registerVaultPasswordConfirm,
        setRegisterVaultPasswordConfirm,
        status,
        onLogin,
        onCreateUser,
    } = props

    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)
    const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false)
    const [showRegisterVaultPassword, setShowRegisterVaultPassword] = useState(false)
    const [showRegisterVaultPasswordConfirm, setShowRegisterVaultPasswordConfirm] =
        useState(false)

    function renderPasswordField({
        label,
        value,
        onChange,
        placeholder,
        visible,
        onToggleVisible,
    }: {
        label: string
        value: string
        onChange: (value: string) => void
        placeholder: string
        visible: boolean
        onToggleVisible: () => void
    }) {
        return (
            <>
                <label style={labelStyle}>{label}</label>

                <div style={{ position: 'relative', display: 'flex' }}>
                    <input
                        style={{
                            ...inputStyle,
                            width: '100%',
                            paddingRight: 40,
                        }}
                        type={visible ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                    />

                    <button
                        type="button"
                        onClick={onToggleVisible}
                        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.7,
                        }}
                    >
                        {visible ? <EyeOff size={18} color='white' /> : <Eye size={18} color='white' />}
                    </button>
                </div>
            </>
        )
    }

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
                            src="./icon128.png"
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

                        {renderPasswordField({
                            label: 'Contraseña de login',
                            value: loginPassword,
                            onChange: setLoginPassword,
                            placeholder: 'Tu contraseña de login',
                            visible: showLoginPassword,
                            onToggleVisible: () =>
                                setShowLoginPassword((v) => !v),
                        })}

                        <button style={primaryButtonStyle} onClick={onLogin}>
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

                        {renderPasswordField({
                            label: 'Contraseña de login',
                            value: registerPassword,
                            onChange: setRegisterPassword,
                            placeholder: 'Elegí una contraseña de login',
                            visible: showRegisterPassword,
                            onToggleVisible: () =>
                                setShowRegisterPassword((v) => !v),
                        })}

                        {renderPasswordField({
                            label: 'Confirmar contraseña de login',
                            value: registerPasswordConfirm,
                            onChange: setRegisterPasswordConfirm,
                            placeholder: 'Repetí la contraseña de login',
                            visible: showRegisterPasswordConfirm,
                            onToggleVisible: () =>
                                setShowRegisterPasswordConfirm((v) => !v),
                        })}

                        {renderPasswordField({
                            label: 'Master password del vault',
                            value: registerVaultPassword,
                            onChange: setRegisterVaultPassword,
                            placeholder: 'Elegí una master password',
                            visible: showRegisterVaultPassword,
                            onToggleVisible: () =>
                                setShowRegisterVaultPassword((v) => !v),
                        })}

                        {renderPasswordField({
                            label: 'Confirmar master password',
                            value: registerVaultPasswordConfirm,
                            onChange: setRegisterVaultPasswordConfirm,
                            placeholder: 'Repetí la master password',
                            visible: showRegisterVaultPasswordConfirm,
                            onToggleVisible: () =>
                                setShowRegisterVaultPasswordConfirm((v) => !v),
                        })}

                        <button style={secondaryButtonStyle} onClick={onCreateUser}>
                            Crear usuario
                        </button>
                    </section>
                </div>

                <div style={statusBoxStyle}>{status}</div>
            </div>
        </div>
    )
}