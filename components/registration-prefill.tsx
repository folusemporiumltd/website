'use client'
import { useEffect } from 'react'
export default function RegistrationPrefill({ enabled }: { enabled: boolean }) {
  useEffect(() => { if (!enabled) return; try { const draft = JSON.parse(window.localStorage.getItem('folus-va-registration') || '{}'); for (const key of ['name', 'email', 'phone', 'address', 'city', 'state']) { const field = document.getElementById(key) as HTMLInputElement | HTMLTextAreaElement | null; if (field && typeof draft[key] === 'string') field.value = draft[key] } } catch {} }, [enabled])
  return null
}
