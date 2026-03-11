//src/components/views/HomeView.tsx
import {
    authWrapperStyle,
    cardTitleStyle,
    dangerButtonStyle,
    ghostButtonStyle,
    heroStyle,
    homeCardStyle,
    homeCardTextStyle,
    homeGridStyle,
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
}

export function HomeView({
    status,
    onOpenPasswords,
    onOpenNotes,
    onDeleteUser,
    onLogout,
}: HomeViewProps) {
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
                    <button style={dangerButtonStyle} onClick={onDeleteUser}>
                        Eliminar usuario
                    </button>
                    <button style={ghostButtonStyle} onClick={onLogout}>
                        Cerrar sesión
                    </button>
                </div>

                <div style={statusBoxStyle}>{status}</div>
            </div>
        </div>
    )
}