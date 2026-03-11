//src/components/views/AuthView.tsx
import type { Dispatch, SetStateAction } from 'react'
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

                        <label style={labelStyle}>Contraseña de login</label>
                        <input
                            style={inputStyle}
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Tu contraseña de login"
                        />

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