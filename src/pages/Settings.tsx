import { useState, useEffect } from 'react'
import { getApiKey, setApiKey as storeApiKey, removeApiKey, getFavorites, removeFavorite } from '../lib/storage'
import type { Favorite, Recipe } from '../types'

export default function Settings({ onApiKeyRemoved }: { onApiKeyRemoved: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [editing, setEditing] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [expandedFav, setExpandedFav] = useState<number | null>(null)

  useEffect(() => { setApiKey(getApiKey()); setFavorites(getFavorites()) }, [])

  const handleUpdate = () => {
    const t = newKey.trim(); if (!t) return
    storeApiKey(t); setApiKey(t); setNewKey(''); setEditing(false)
  }

  const handleRemoveKey = () => { removeApiKey(); onApiKeyRemoved() }

  const handleRemoveFav = (id: number) => { removeFavorite(id); setFavorites((p) => p.filter((f) => f.id !== id)) }

  const masked = apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : ''

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-center">⚙️ 設定</h2>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-3">🔑 Groq APIキー</h3>
        {!editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm break-all">{showKey ? apiKey : masked}</code>
              <button onClick={() => setShowKey(!showKey)} className="text-sm text-gray-500">{showKey ? '🙈' : '👁️'}</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 py-2 rounded-lg font-medium">変更</button>
              <button onClick={handleRemoveKey} className="flex-1 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg font-medium">削除</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="新しいAPIキー"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg focus:border-accent focus:outline-none text-sm" />
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="flex-1 bg-accent text-white text-sm py-2 rounded-lg font-medium">保存</button>
              <button onClick={() => { setEditing(false); setNewKey('') }} className="flex-1 bg-gray-100 dark:bg-gray-700 text-sm py-2 rounded-lg font-medium">キャンセル</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-3">❤️ お気に入りレシピ</h3>
        {favorites.length === 0 ? <p className="text-gray-400 text-sm">お気に入りはまだありません</p> : (
          <div className="space-y-2">
            {favorites.map((fav) => {
              let recipe: Recipe | null = null; try { recipe = JSON.parse(fav.recipe_data) } catch {}
              const exp = expandedFav === fav.id
              return (
                <div key={fav.id} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedFav(exp ? null : fav.id)}>
                    <span className="text-sm font-medium">{fav.recipe_name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveFav(fav.id) }} className="text-xs text-red-400">削除</button>
                      <span className="text-gray-400 text-xs">{exp ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {exp && recipe && (
                    <div className="px-3 pb-3 text-sm space-y-2 animate-fade-in">
                      <p className="text-gray-500">{recipe.description}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent">⏱️ {recipe.cookingTime}分</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{recipe.difficulty}</span>
                      </div>
                      <p className="text-xs text-gray-500">材料: {recipe.ingredients.map((i) => i.name).join('、')}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="text-center text-gray-400 text-xs space-y-1 pb-4">
        <p>🍙 なにめし Web v1.0.0</p>
        <p>Powered by Groq + Llama 3.3</p>
      </div>
    </div>
  )
}
