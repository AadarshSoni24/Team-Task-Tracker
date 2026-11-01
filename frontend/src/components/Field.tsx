import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

export const inputClass =
  'w-full rounded-md border border-line-strong bg-canvas px-2.5 text-[13px] text-fg placeholder:text-faint transition-colors duration-150 hover:border-border-hover focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-rose-500/70 aria-[invalid=true]:focus:ring-rose-500/20'

export function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null
  return (
    <p id={id} className="mt-1.5 text-[12px] text-rose-400 animate-fade-up">
      {messages.join(' ')}
    </p>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errors?: string[]
  hint?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, errors, hint, id, className = '', ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errId = `${inputId}-err`
  const invalid = !!errors?.length
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-[12px] font-medium text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={invalid}
        aria-describedby={invalid ? errId : undefined}
        className={`${inputClass} h-9`}
        {...rest}
      />
      {hint && !invalid && <p className="mt-1.5 text-[12px] text-faint">{hint}</p>}
      <FieldError id={errId} messages={errors} />
    </div>
  )
})

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  errors?: string[]
}

export function TextAreaField({ label, errors, id, className = '', ...rest }: TextAreaFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errId = `${inputId}-err`
  const invalid = !!errors?.length
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-[12px] font-medium text-muted">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={invalid}
        aria-describedby={invalid ? errId : undefined}
        className={`${inputClass} min-h-20 resize-y py-2`}
        {...rest}
      />
      <FieldError id={errId} messages={errors} />
    </div>
  )
}

