import ThemeToggle from '@/components/ThemeToggle'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-4 sm:py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between sm:mb-8">
        <a href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            DAOboard
          </h1>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="rounded-lg bg-purple-600/10 px-3 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
          >
            Admin
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Dashboard */}
      <Dashboard />
    </main>
  )
}
