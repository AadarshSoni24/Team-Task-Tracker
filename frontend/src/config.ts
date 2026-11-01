/** Base URL for every Cadence API request. Override with NEXT_PUBLIC_API_BASE_URL if needed. */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api'

