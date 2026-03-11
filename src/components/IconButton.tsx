//src/components/IconButton.tsx
import type { CSSProperties, ReactNode } from 'react'
import { iconButtonStyle, iconButtonDangerStyle } from '../styles/appStyles'

type IconButtonProps = {
    title: string
    onClick: () => void
    children: ReactNode
    disabled?: boolean
    danger?: boolean
    style?: CSSProperties
}

export function IconButton({
    title,
    onClick,
    children,
    disabled = false,
    danger = false,
    style,
}: IconButtonProps) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            style={{
                ...(danger ? iconButtonDangerStyle : iconButtonStyle),
                ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
                ...style,
            }}
        >
            {children}
        </button>
    )
}