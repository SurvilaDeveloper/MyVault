//src/components/UnsavedChangesModal.tsx
import {
    modalButtonsStyle,
    modalCardStyle,
    modalOverlayStyle,
    modalTextStyle,
    modalTitleStyle,
    primaryButtonStyle,
    dangerButtonStyle,
    ghostButtonStyle,
} from '../styles/appStyles'

type UnsavedChangesModalProps = {
    open: boolean
    title: string
    description: string
    primaryLabel: string
    secondaryLabel: string
    onSave: () => void
    onDiscard: () => void
    onCancel: () => void
}

export function UnsavedChangesModal({
    open,
    title,
    description,
    primaryLabel,
    secondaryLabel,
    onSave,
    onDiscard,
    onCancel,
}: UnsavedChangesModalProps) {
    if (!open) return null

    return (
        <div style={modalOverlayStyle}>
            <div style={modalCardStyle}>
                <h2 style={modalTitleStyle}>{title}</h2>
                <p style={modalTextStyle}>{description}</p>

                <div style={modalButtonsStyle}>
                    <button style={primaryButtonStyle} onClick={onSave}>
                        {primaryLabel}
                    </button>

                    <button style={dangerButtonStyle} onClick={onDiscard}>
                        {secondaryLabel}
                    </button>

                    <button style={ghostButtonStyle} onClick={onCancel}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}