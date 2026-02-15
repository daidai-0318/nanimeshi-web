import { useState, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { hasApiKey as checkApiKey } from './lib/storage'
import Home from './pages/Home'
import Consult from './pages/Consult'
import RecipeView from './pages/RecipeView'
import History from './pages/History'
import Settings from './pages/Settings'
import ManualEntry from './pages/ManualEntry'
import ShoppingList from './pages/ShoppingList'
import ApiKeySetup from './components/ApiKeySetup'
import type { Recipe, AppMode } from './types'

type Page = 'home' | 'consult' | 'recipe' | 'history' | 'settings' | 'manual' | 'shopping'

export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const [page, setPage] = useState<Page>('home')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [mode, setMode] = useState<AppMode>('consult')
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    setHasKey(checkApiKey())
  }, [])

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // ページ切り替え時にスクロール位置をトップに戻す
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  const handleSelectMode = (m: AppMode) => {
    setMode(m)
    setPage('consult')
  }

  const handleRecipeReady = (r: Recipe) => {
    setRecipe(r)
    setPage('recipe')
  }

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-cream dark:bg-dark-bg flex items-center justify-center">
        <div className="text-2xl animate-bounce-cook">🍙</div>
      </div>
    )
  }

  if (!hasKey) {
    return <ApiKeySetup onComplete={() => setHasKey(true)} />
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg text-gray-800 dark:text-gray-100 transition-colors duration-300 safe-top">
      {!isOnline && (
        <div className="bg-red-400 text-white text-center text-sm py-1.5 px-4 font-medium">
          📡 ネットワークに接続されていません
        </div>
      )}

      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        {page !== 'home' ? (
          <button onClick={() => setPage('home')} className="text-accent hover:text-accent-dark text-sm font-bold flex items-center gap-1 active:scale-95 transition-all">
            <span className="text-lg">‹</span> ホーム
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-90"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setPage('settings')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-90"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="px-4 pb-8 safe-bottom">
        {page === 'home' && <Home onSelectMode={handleSelectMode} onOpenHistory={() => setPage('history')} onOpenManualEntry={() => setPage('manual')} onOpenShoppingList={() => setPage('shopping')} />}
        {page === 'consult' && <Consult mode={mode} onRecipeReady={handleRecipeReady} onBack={() => setPage('home')} />}
        {page === 'recipe' && recipe && (
          <RecipeView recipe={recipe} mode={mode} onBack={() => setPage('home')} onRetry={() => setPage('consult')} />
        )}
        {page === 'history' && <History onOpenManualEntry={() => setPage('manual')} />}
        {page === 'settings' && <Settings onApiKeyRemoved={() => setHasKey(false)} />}
        {page === 'manual' && <ManualEntry onBack={() => setPage('home')} onSaved={() => setPage('history')} />}
        {page === 'shopping' && <ShoppingList onBack={() => setPage('home')} />}
      </main>
    </div>
  )
}
