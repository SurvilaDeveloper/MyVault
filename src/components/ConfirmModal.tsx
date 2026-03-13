//src/components/ConfirmModal.tsx
import { AlertTriangle } from 'lucide-react'

type ConfirmModalProps = {
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    busy?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.78)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                zIndex: 9999,
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-description"
                style={{
                    width: '100%',
                    maxWidth: 520,
                    background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.16)',
                    borderRadius: 22,
                    boxShadow: '0 28px 80px rgba(0, 0, 0, 0.42)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: 22,
                        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            flex: '0 0 auto',
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            display: 'grid',
                            placeItems: 'center',
                            background: danger
                                ? 'rgba(239, 68, 68, 0.14)'
                                : 'rgba(56, 189, 248, 0.14)',
                            color: danger ? '#f87171' : '#38bdf8',
                        }}
                    >
                        <AlertTriangle size={20} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <h2
                            id="confirm-modal-title"
                            style={{
                                margin: 0,
                                color: '#f8fafc',
                                fontSize: 20,
                                lineHeight: 1.2,
                            }}
                        >
                            {title}
                        </h2>

                        <p
                            id="confirm-modal-description"
                            style={{
                                margin: '10px 0 0',
                                color: '#94a3b8',
                                fontSize: 14,
                                lineHeight: 1.55,
                            }}
                        >
                            {description}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 10,
                        padding: 18,
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        style={{
                            border: '1px solid rgba(148, 163, 184, 0.18)',
                            background: 'rgba(15, 23, 42, 0.85)',
                            color: '#e5e7eb',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            opacity: busy ? 0.65 : 1,
                        }}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        style={{
                            border: 'none',
                            background: danger
                                ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
                            color: '#f8fafc',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            opacity: busy ? 0.7 : 1,
                            boxShadow: danger
                                ? '0 10px 24px rgba(220, 38, 38, 0.28)'
                                : '0 10px 24px rgba(14, 165, 233, 0.28)',
                        }}
                    >
                        {busy ? 'Procesando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}