//src/components/views/UnlockView.tsx
import type { Dispatch, SetStateAction } from 'react'
import {
    authWrapperStyle,
    cardStyle,
    ghostButtonStyle,
    heroStyle,
    inputStyle,
    labelStyle,
    pageStyle,
    primaryButtonStyle,
    statusBoxStyle,
    subtitleStyle,
    titleStyle,
} from '../../styles/appStyles'

type UnlockViewProps = {
    unlockPassword: string
    setUnlockPassword: Dispatch<SetStateAction<string>>
    status: string
    onUnlock: () => void
    onBack: () => void
}

export function UnlockView({
    unlockPassword,
    setUnlockPassword,
    status,
    onUnlock,
    onBack,
}: UnlockViewProps) {
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
                        <button style={primaryButtonStyle} onClick={onUnlock}>
                            Desbloquear
                        </button>

                        <button style={ghostButtonStyle} onClick={onBack}>
                            Volver
                        </button>
                    </div>
                </section>

                <div style={statusBoxStyle}>{status}</div>
            </div>
        </div>
    )
}