'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { ApiError } from '@/lib/api'
import type { FieldErrors } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'
import { AuthCard, AuthLayout, FormAlert } from '@/components/AuthLayout'
import { SplashScreen } from '@/components/StatusPages'

export default function LoginPage() {
  const { login, status } = useAuth()
  const router = useRouter()
  const handleError = useApiError()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
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
    if (!email.trim()) next.email = ['Enter your email address.']
    if (!password) next.password = ['Enter your password.']
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setFormError(err.detail)
      else handleError(err, { keys: ['email', 'password'], set: setErrors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="Welcome back" subtitle="Log in to pick up where your team left off.">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert message={formError} />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errors={errors.email}
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errors={errors.password}
          />
          <Button type="submit" variant="primary" className="h-9 w-full" loading={submitting}>
            Log in
          </Button>
        </form>
      </AuthCard>
      <p className="mt-5 text-center text-[13px] text-muted">
        New to Cadence?{' '}
        <Link href="/register" className="font-medium text-fg underline-offset-4 transition-colors hover:text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

