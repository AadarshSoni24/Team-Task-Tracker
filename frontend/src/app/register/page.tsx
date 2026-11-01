'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/Button'
import { FieldError, TextField } from '@/components/Field'
import type { FieldErrors, Role } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'
import { AuthCard, AuthLayout } from '@/components/AuthLayout'
import { SplashScreen } from '@/components/StatusPages'

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'member', label: 'Member', description: 'Work on tasks and comment in teams you join.' },
  { value: 'admin', label: 'Admin', description: 'Also create teams and invite people to them.' },
]

export default function RegisterPage() {
  const { register, status } = useAuth()
  const router = useRouter()
  const handleError = useApiError()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return <SplashScreen />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (!name.trim()) next.name = ['Tell us your name.']
    if (!email.trim()) next.email = ['Enter your email address.']
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = ['Enter a valid email address.']
    if (password.length < 8) next.password = ['Use at least 8 characters.']
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password, role })
      router.replace('/dashboard')
    } catch (err) {
      handleError(err, { keys: ['name', 'email', 'password', 'role'], set: setErrors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="Create your account" subtitle="It takes less than a minute.">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField
            label="Full name"
            autoComplete="name"
            placeholder="Kavita Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            errors={errors.name}
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errors={errors.email}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errors={errors.password}
            hint="Minimum 8 characters."
          />
          <fieldset>
            <legend className="mb-1.5 text-[12px] font-medium text-muted">Role</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const checked = role === r.value
                return (
                  <label
                    key={r.value}
                    className={`relative cursor-pointer rounded-lg border p-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent/75 ${
                      checked ? 'border-accent/60 bg-accent/[0.06]' : 'border-line-strong hover:border-border-hover hover:bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={checked}
                      onChange={() => setRole(r.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <span
                        className={`flex size-3.5 items-center justify-center rounded-full border transition-colors ${
                          checked ? 'border-accent' : 'border-border-radio'
                        }`}
                      >
                        {checked && <span className="size-1.5 rounded-full bg-accent" />}
                      </span>
                      {r.label}
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-snug text-muted">{r.description}</span>
                  </label>
                )
              })}
            </div>
            <FieldError id="role-err" messages={errors.role} />
          </fieldset>
          <Button type="submit" variant="primary" className="h-9 w-full" loading={submitting}>
            Create account
          </Button>
        </form>
      </AuthCard>
      <p className="mt-5 text-center text-[13px] text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-fg underline-offset-4 transition-colors hover:text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

