import type { ReactNode } from 'react'
import { LogoMark } from '@/components/Logo'

function Beats() {
  // A quiet rhythmic visual: bars rising and settling like a team's weekly cadence.
  const heights = [28, 44, 36, 60, 48, 72, 56, 84, 64, 92, 70, 100]
  return (
    <div className="flex h-28 items-end gap-2" aria-hidden="true">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-3 rounded-full"
          style={{
            height: `${h}%`,
            background:
              i % 4 === 3
                ? 'linear-gradient(to top, rgb(45 212 191 / 0.15), rgb(45 212 191 / 0.85))'
                : 'linear-gradient(to top, rgb(255 255 255 / 0.02), rgb(255 255 255 / 0.12))',
          }}
        />
      ))}
    </div>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(45 212 191 / 0.10), transparent)' }}
      />
      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10">
        <section className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[18px] font-semibold tracking-[-0.02em]">Cadence</span>
          </div>
          <h1 className="mt-8 hidden text-[40px] leading-[1.08] font-semibold tracking-[-0.035em] text-fg lg:block">
            Keep your team
            <br />
            <span className="text-accent">in rhythm.</span>
          </h1>
          <p className="mt-3 max-w-sm text-[14px] text-muted lg:mt-5 lg:text-[15px]">
            Cadence is the calm task tracker for small teams. Plan the work, move it forward, and watch progress
            land in a live timeline.
          </p>
          <div className="mt-10 hidden lg:block">
            <Beats />
          </div>
        </section>
        <section className="mx-auto w-full max-w-[400px]">{children}</section>
      </div>
    </div>
  )
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line-strong bg-panel/90 p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur sm:p-7">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-md border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2 text-[12.5px] text-rose-300 animate-fade-up">
      {message}
    </div>
  )
}

