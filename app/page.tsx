import ThemeToggle from '@/components/ThemeToggle'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            DAOboard
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Dashboard */}
      <Dashboard />
    </main>
  )
}
