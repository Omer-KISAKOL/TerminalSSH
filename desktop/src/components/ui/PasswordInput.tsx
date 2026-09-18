import { useState } from 'react'

type PasswordInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
  className?: string
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PasswordInput({
  id,
  value,
  onChange,
  disabled = false,
  autoComplete,
  placeholder,
  className = 'field-input',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? 'Parolayı gizle' : 'Parolayı göster'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  )
}
