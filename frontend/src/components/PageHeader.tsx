'use client'

import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { useShell } from './AppShell'
import { IconChevronRight, IconMenu } from './icons'

export interface Crumb {
  label: ReactNode
  to?: string
}

export function PageHeader({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) {
  const { openNav } = useShell()
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 md:px-4">
      <button
        type="button"
        onClick={openNav}
        className="-ml-1 rounded-md p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-fg md:hidden"
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <Fragment key={i}>
                <li className={`flex min-w-0 items-center gap-1.5 ${last ? 'font-medium text-fg' : 'shrink-0 text-muted'}`}>
                  {i > 0 && <IconChevronRight size={12} className="shrink-0 text-faint" />}
                  {c.to && !last ? (
                    <Link href={c.to} className="rounded transition-colors duration-150 hover:text-fg">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="block truncate" aria-current={last ? 'page' : undefined}>
                      {c.label}
                    </span>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

