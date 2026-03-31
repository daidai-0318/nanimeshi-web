import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg flex flex-col items-center justify-center px-6">
      <div className="animate-fade-in text-center max-w-sm w-full">
        <div className="text-6xl mb-4 animate-float">🍚</div>
        <h1 className="text-4xl font-bold gradient-text mb-2">なにめし</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-10">冷蔵庫の中身や気分からレシピを提案</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-bounce-cook inline-block">🍳</span>
              ログイン中...
            </span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleでログイン
            </>
          )}
        </button>

        <div className="mt-8 space-y-2 text-xs text-gray-400">
          <p>ログインすると、レシピやお気に入りが</p>
          <p>クラウドに保存され、どの端末からでもアクセスできます</p>
        </div>
      </div>
    </div>
  )
}
