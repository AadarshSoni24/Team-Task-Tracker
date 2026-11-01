'use client'

import Link from 'next/link'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { LogoMark } from '@/components/Logo'

const linkBtn =
  'inline-flex h-8 items-center rounded-md border border-line-strong bg-raised px-3 text-[13px] font-medium text-fg transition-colors duration-150 hover:bg-hover'

export function NoAccessState({ detail }: { detail?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        art="lock"
        title="You don't have access to this"
        description={detail ?? 'This belongs to a team you are not part of. Ask a team admin to invite you.'}
        action={
          <Link href="/dashboard" className={linkBtn}>
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}

export function NotFoundState({ what = 'page' }: { what?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        art="compass"
        title={`We couldn't find that ${what}`}
        description="It may have been moved, or the link might be mistyped."
        action={
          <Link href="/dashboard" className={linkBtn}>
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}

export function NotFoundPage() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <LogoMark size={28} />
      <p className="mt-8 text-[56px] leading-none font-semibold tracking-[-0.05em] text-watermark">404</p>
      <h1 className="mt-4 text-[17px] font-semibold">This page skipped a beat</h1>
      <p className="mt-1.5 max-w-sm text-[13px] text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href={user ? '/dashboard' : '/login'} className={`${linkBtn} mt-6`}>
        {user ? 'Go to dashboard' : 'Go to login'}
      </Link>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" aria-busy="true" aria-label="Loading Cadence">
      <div className="animate-pulse">
        <LogoMark size={32} />
      </div>
    </div>
  )
}

