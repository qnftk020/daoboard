'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('daoboard-theme')
    if (saved === 'light') {
      setDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('daoboard-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('daoboard-theme', 'light')
      }
      return next
    })
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium transition hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {dark ? (
        <>
          <span className="text-lg">🌙</span>
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <span className="text-lg">☀️</span>
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </button>
  )
}
