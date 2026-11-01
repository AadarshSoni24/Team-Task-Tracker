'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

const ShellContext = createContext<{ openNav: () => void }>({ openNav: () => {} })
export const useShell = () => useContext(ShellContext)

export function AppShell({ children }: { children?: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setNavOpen(false), [pathname])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <ShellContext.Provider value={{ openNav: () => setNavOpen(true) }}>
      <div className="flex h-dvh overflow-hidden bg-canvas">
        <aside className="hidden w-60 shrink-0 md:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-40 md:hidden ${navOpen ? '' : 'pointer-events-none'}`} aria-hidden={!navOpen}>
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-150 ${navOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setNavOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 left-0 w-[272px] border-r border-line bg-surface-drawer shadow-2xl transition-transform duration-200 ease-out ${
              navOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar onClose={() => setNavOpen(false)} />
          </aside>
        </div>

        <main className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-line bg-panel md:rounded-xl md:border">
            {children}
          </div>
        </main>
      </div>
    </ShellContext.Provider>
  )
}

