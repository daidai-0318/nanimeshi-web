import { useState, useEffect, useMemo } from 'react'
import { getApiKey, setApiKey as storeApiKey, removeApiKey, getFavorites, removeFavorite, getPantry, removeFromPantry, getPFCGoals, savePFCGoals, removePFCGoals } from '../lib/storage'
import type { Favorite, Recipe, Category, PFCGoals } from '../types'

const defaultGoals: PFCGoals = { calories: 2000, protein: 60, fat: 55, carbs: 300 }

export default function Settings({ onApiKeyRemoved }: { onApiKeyRemoved: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [editing, setEditing] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [expandedFav, setExpandedFav] = useState<number | null>(null)
  const [favSearch, setFavSearch] = useState('')
  const [favCategory, setFavCategory] = useState<Category | ''>('')
  const [pantry, setPantry] = useState<string[]>([])
  const [goals, setGoals] = useState<PFCGoals | null>(null)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goalDraft, setGoalDraft] = useState<PFCGoals>(defaultGoals)

  useEffect(() => {
    setApiKey(getApiKey())
    setFavorites(getFavorites())
    setPantry(getPantry())
    const saved = getPFCGoals()
    setGoals(saved)
    if (saved) setGoalDraft(saved)
  }, [])

  const handleUpdate = () => {
    const t = newKey.trim(); if (!t) return
    storeApiKey(t); setApiKey(t); setNewKey(''); setEditing(false)
  }

  const handleRemoveKey = () => { removeApiKey(); onApiKeyRemoved() }

  const handleRemoveFav = (id: number) => { removeFavorite(id); setFavorites((p) => p.filter((f) => f.id !== id)) }

  const handleRemovePantryItem = (item: string) => { removeFromPantry(item); setPantry((p) => p.filter((i) => i !== item)) }

  const handleSaveGoals = () => {
    savePFCGoals(goalDraft)
    setGoals(goalDraft)
    setEditingGoals(false)
  }

  const handleRemoveGoals = () => {
    removePFCGoals()
    setGoals(null)
    setEditingGoals(false)
    setGoalDraft(defaultGoals)
  }

  const masked = apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : ''

  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      const nameMatch = !favSearch || fav.recipe_name.toLowerCase().includes(favSearch.toLowerCase())
      if (!favCategory) return nameMatch
      try {
        const recipe: Recipe = JSON.parse(fav.recipe_data)
        return nameMatch && recipe.category === favCategory
      } catch { return nameMatch }
    })
  }, [favorites, favSearch, favCategory])

  const categories: Category[] = ['肉料理', '魚料理', '野菜料理', '麺類', 'ご飯もの', 'スープ', 'その他']

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-center">⚙️ 設定</h2>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
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

      {/* PFC目標設定 */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-3">🎯 栄養目標（1日あたり）</h3>
        {!editingGoals ? (
          <div className="space-y-3">
            {goals ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">カロリー</p>
                    <span className="text-xl font-bold gradient-text">{goals.calories}</span>
                    <span className="text-xs text-gray-400 ml-0.5">kcal</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />タンパク質
                    </p>
                    <span className="text-xl font-bold">{goals.protein}</span>
                    <span className="text-xs text-gray-400 ml-0.5">g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />脂質
                    </p>
                    <span className="text-xl font-bold">{goals.fat}</span>
                    <span className="text-xs text-gray-400 ml-0.5">g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />炭水化物
                    </p>
                    <span className="text-xl font-bold">{goals.carbs}</span>
                    <span className="text-xs text-gray-400 ml-0.5">g</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setGoalDraft(goals); setEditingGoals(true) }} className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 py-2 rounded-lg font-medium">変更</button>
                  <button onClick={handleRemoveGoals} className="flex-1 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg font-medium">リセット</button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-400">目標が未設定です</p>
                <button onClick={() => setEditingGoals(true)} className="bg-accent text-white text-sm py-2 px-6 rounded-lg font-medium">目標を設定する</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">カロリー (kcal)</label>
              <input type="number" value={goalDraft.calories} onChange={(e) => setGoalDraft({ ...goalDraft, calories: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">P (g)</label>
                <input type="number" value={goalDraft.protein} onChange={(e) => setGoalDraft({ ...goalDraft, protein: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">F (g)</label>
                <input type="number" value={goalDraft.fat} onChange={(e) => setGoalDraft({ ...goalDraft, fat: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">C (g)</label>
                <input type="number" value={goalDraft.carbs} onChange={(e) => setGoalDraft({ ...goalDraft, carbs: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-400">成人男性: 約2200kcal / 成人女性: 約1800kcal が目安</p>
            <div className="flex gap-2">
              <button onClick={handleSaveGoals} className="flex-1 bg-accent text-white text-sm py-2 rounded-lg font-medium">保存</button>
              <button onClick={() => setEditingGoals(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-sm py-2 rounded-lg font-medium">キャンセル</button>
            </div>
          </div>
        )}
      </div>

      {/* パントリー管理 */}
      {pantry.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-3">🧊 よく使う食材 <span className="text-xs text-gray-400 font-normal">(自動記録)</span></h3>
          <div className="flex flex-wrap gap-2">
            {pantry.map((item) => (
              <span key={item} className="bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full text-sm text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50 flex items-center gap-1.5">
                {item}
                <button onClick={() => handleRemovePantryItem(item)} className="text-teal-400 hover:text-red-400 text-xs transition-colors">✕</button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">「食べた！」を押すと食材が自動で記録されます。相談モードで素早く食材を選べます。</p>
        </div>
      )}

      {/* お気に入りレシピ */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-3">❤️ お気に入りレシピ</h3>
        {favorites.length === 0 ? <p className="text-gray-400 text-sm">お気に入りはまだありません</p> : (
          <div className="space-y-3">
            {/* 検索・フィルタ */}
            {favorites.length > 3 && (
              <div className="space-y-2">
                <input
                  type="text" value={favSearch} onChange={(e) => setFavSearch(e.target.value)}
                  placeholder="🔍 レシピ名で検索..."
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setFavCategory('')}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${!favCategory ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    全て
                  </button>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setFavCategory(favCategory === cat ? '' : cat)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${favCategory === cat ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredFavorites.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">該当するレシピがありません</p>
              ) : (
                filteredFavorites.map((fav) => {
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
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{recipe.category}</span>
                          </div>
                          <p className="text-xs text-gray-500">材料: {recipe.ingredients.map((i) => i.name).join('、')}</p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-gray-400 text-xs space-y-1 pb-4">
        <p>🍙 なにめし Web v2.0.0</p>
        <p>Powered by Groq + Llama 3.3</p>
      </div>
    </div>
  )
}
