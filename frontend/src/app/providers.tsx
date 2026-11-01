'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/auth/AuthContext'
import { ToastProvider } from '@/components/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  )
}

