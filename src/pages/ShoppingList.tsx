import { useState, useEffect, useMemo } from 'react'
import { getShoppingList, toggleShoppingItem, removeShoppingItem, clearShoppingList, addToShoppingList, getFavorites } from '../lib/storage'
import type { ShoppingItem, Recipe } from '../types'

interface Props {
  onBack: () => void
}

export default function ShoppingList({ onBack }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [showFavorites, setShowFavorites] = useState(false)

  const reload = () => setItems(getShoppingList())
  useEffect(() => { reload() }, [])

  const unchecked = useMemo(() => items.filter((i) => !i.checked), [items])
  const checked = useMemo(() => items.filter((i) => i.checked), [items])

  const handleToggle = (id: number) => {
    toggleShoppingItem(id)
    reload()
  }

  const handleRemove = (id: number) => {
    removeShoppingItem(id)
    reload()
  }

  const handleClear = () => {
    clearShoppingList()
    reload()
  }

  const handleAddFromFavorite = (recipeName: string, recipeData: string) => {
    try {
      const recipe: Recipe = JSON.parse(recipeData)
      addToShoppingList(recipe.ingredients, recipeName)
      reload()
      setShowFavorites(false)
    } catch {
      // parse error
    }
  }

  const favorites = useMemo(() => {
    if (!showFavorites) return []
    return getFavorites()
  }, [showFavorites])

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <div className="text-center pt-2">
        <div className="text-5xl mb-3">🛒</div>
        <h2 className="text-2xl font-bold gradient-text">買い物リスト</h2>
      </div>

      {items.length === 0 && !showFavorites && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-5xl mb-3">📝</p>
          <p className="text-sm mb-1">リストが空です</p>
          <p className="text-xs">レシピ画面やお気に入りから追加できます</p>
        </div>
      )}

      {/* 未チェックアイテム */}
      {unchecked.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-sm">買うもの ({unchecked.length})</h3>
          </div>
          <ul>
            {unchecked.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <button onClick={() => handleToggle(item.id)}
                  className="w-6 h-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 flex items-center justify-center hover:border-accent/50 transition-all" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.amount && <span className="text-xs text-gray-400 ml-2">{item.amount}</span>}
                </div>
                {item.recipe_name && (
                  <span className="text-xs text-gray-400 truncate max-w-20">{item.recipe_name}</span>
                )}
                <button onClick={() => handleRemove(item.id)} className="text-gray-300 hover:text-red-400 text-sm transition-colors flex-shrink-0">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* チェック済みアイテム */}
      {checked.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden opacity-60">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-sm text-gray-400">購入済み ({checked.length})</h3>
          </div>
          <ul>
            {checked.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <button onClick={() => handleToggle(item.id)}
                  className="w-6 h-6 rounded-lg border-2 bg-accent border-accent text-white flex-shrink-0 flex items-center justify-center transition-all">
                  <span className="text-xs">✓</span>
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-sm line-through text-gray-400">{item.name}</span>
                  {item.amount && <span className="text-xs text-gray-300 ml-2 line-through">{item.amount}</span>}
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-gray-300 hover:text-red-400 text-sm transition-colors flex-shrink-0">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* アクションボタン */}
      <div className="space-y-3">
        <button onClick={() => setShowFavorites(!showFavorites)}
          className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm">
          {showFavorites ? '✕ 閉じる' : '⭐ お気に入りから追加'}
        </button>
        {items.length > 0 && (
          <button onClick={handleClear}
            className="w-full text-red-400 text-sm py-2 hover:text-red-600 transition-colors">
            リストをクリア
          </button>
        )}
      </div>

      {/* お気に入りからの追加 */}
      {showFavorites && (
        <div className="animate-slide-in space-y-2">
          <h3 className="font-bold text-sm px-1">お気に入りレシピ</h3>
          {favorites.length === 0 ? (
            <p className="text-gray-500 text-sm px-1">お気に入りがまだありません</p>
          ) : (
            favorites.map((fav) => (
              <button key={fav.id} onClick={() => handleAddFromFavorite(fav.recipe_name, fav.recipe_data)}
                className="w-full text-left bg-white dark:bg-dark-card rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.97] transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{fav.recipe_name}</span>
                  <span className="text-accent text-xs font-medium">+ 追加</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <button onClick={onBack} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">ホームに戻る</button>
    </div>
  )
}
