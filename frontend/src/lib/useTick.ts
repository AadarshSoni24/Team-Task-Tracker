'use client'

import { useEffect, useState } from 'react'

/** Re-renders periodically so relative timestamps stay fresh. */
export function useTick(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

