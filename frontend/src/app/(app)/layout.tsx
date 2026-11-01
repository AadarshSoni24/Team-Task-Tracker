'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/auth/AuthContext'
import { TeamsProvider } from '@/auth/TeamsContext'
import { AppShell } from '@/components/AppShell'
import { SplashScreen } from '@/components/StatusPages'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading' || status === 'anonymous') {
    return <SplashScreen />
  }

  return (
    <TeamsProvider>
      <AppShell>{children}</AppShell>
    </TeamsProvider>
  )
}

