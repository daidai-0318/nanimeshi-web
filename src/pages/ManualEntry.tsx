import { useState } from 'react'
import { addMeal, getApiKey } from '../lib/storage'
import { estimatePFC } from '../lib/claude'
import type { Category, PFC } from '../types'

interface Props {
  onBack: () => void
  onSaved: () => void
}

const categories: { label: Category; emoji: string }[] = [
  { label: '肉料理', emoji: '🥩' },
  { label: '魚料理', emoji: '🐟' },
  { label: '野菜料理', emoji: '🥬' },
  { label: '麺類', emoji: '🍜' },
  { label: 'ご飯もの', emoji: '🍚' },
  { label: 'スープ', emoji: '🍲' },
  { label: 'その他', emoji: '🍽️' },
]

export default function ManualEntry({ onBack, onSaved }: Props) {
  const [recipeName, setRecipeName] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [seasoning, setSeasoning] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [estimatedPFC, setEstimatedPFC] = useState<PFC | null>(null)

  const addIngredient = () => {
    const t = ingredientInput.trim()
    if (t && !ingredients.includes(t)) {
      setIngredients([...ingredients, t])
      setIngredientInput('')
    }
  }

  const handleSave = async () => {
    if (!recipeName.trim() || !category) return
    setLoading(true)
    setError('')

    try {
      const apiKey = getApiKey()
      let pfc: PFC | null = null

      if (apiKey) {
        try {
          const ingredientsStr = [
            ...ingredients,
            ...(seasoning ? [seasoning] : []),
          ].join('、')
          pfc = await estimatePFC(apiKey, {
            recipe_name: recipeName.trim(),
            category,
            ingredients: ingredientsStr || undefined,
          })
          setEstimatedPFC(pfc)
        } catch {
          pfc = null
        }
      }

      addMeal({
        recipe_name: recipeName.trim(),
        category,
        ingredients: JSON.stringify(ingredients.map((name) => ({ name, amount: '' }))),
        pfc,
        is_manual: true,
      })

      setSaved(true)
    } catch (err: any) {
      setError(err?.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const canSave = recipeName.trim().length > 0 && category !== null

  if (saved) {
    return (
      <div className="animate-fade-in space-y-5">
        <div className="text-center pt-6">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-2xl font-bold gradient-text">記録しました！</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{recipeName}</p>
        </div>

        {estimatedPFC && (
          <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-sm mb-4">📊 推定PFCバランス <span className="text-xs text-gray-400 font-normal">(AI推定)</span></h3>
            <div className="flex h-4 rounded-full overflow-hidden mb-4">
              {(() => {
                const total = estimatedPFC.protein + estimatedPFC.fat + estimatedPFC.carbs
                if (total === 0) return null
                return (
                  <>
                    <div className="bg-blue-400" style={{ width: `${(estimatedPFC.protein / total) * 100}%` }} />
                    <div className="bg-yellow-400" style={{ width: `${(estimatedPFC.fat / total) * 100}%` }} />
                    <div className="bg-green-400" style={{ width: `${(estimatedPFC.carbs / total) * 100}%` }} />
                  </>
                )
              })()}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-500">タンパク質</span>
                </div>
                <span className="text-lg font-bold">{estimatedPFC.protein}</span>
                <span className="text-xs text-gray-400">g</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="text-xs text-gray-500">脂質</span>
                </div>
                <span className="text-lg font-bold">{estimatedPFC.fat}</span>
                <span className="text-xs text-gray-400">g</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500">炭水化物</span>
                </div>
                <span className="text-lg font-bold">{estimatedPFC.carbs}</span>
                <span className="text-xs text-gray-400">g</span>
              </div>
            </div>
            <div className="text-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-2xl font-bold gradient-text">{estimatedPFC.calories}</span>
              <span className="text-sm text-gray-500 ml-1">kcal</span>
            </div>
          </div>
        )}

        {!estimatedPFC && (
          <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-400">PFCデータは推定できませんでしたが、食事は記録されました</p>
          </div>
        )}

        <div className="space-y-3">
          <button onClick={() => { setSaved(false); setRecipeName(''); setCategory(null); setIngredients([]); setSeasoning(''); setEstimatedPFC(null) }}
            className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm">
            ✏️ もう1品記録する
          </button>
          <button onClick={onSaved} className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all">
            📖 履歴を見る
          </button>
          <button onClick={onBack} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">ホームに戻る</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center pt-2">
        <div className="text-5xl mb-3">✏️</div>
        <h2 className="text-2xl font-bold gradient-text">食事を記録</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">自分で作った料理を記録しよう</p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-3">🍳 料理名 <span className="text-red-400">*</span></h3>
        <input
          type="text"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          placeholder="例：鶏の唐揚げ"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm transition-colors"
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-3">📂 カテゴリ <span className="text-red-400">*</span></h3>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategory(c.label)}
              className={`p-2.5 rounded-xl text-sm font-medium active:scale-[0.95] transition-all ${
                category === c.label
                  ? 'bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-sm'
              }`}
            >
              <span className="text-lg">{c.emoji}</span>
              <div className="text-xs mt-0.5">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-3">🥕 材料 <span className="text-gray-400 font-normal">(任意)</span></h3>
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {ingredients.map((item) => (
              <span key={item} className="bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 border border-gray-200 dark:border-gray-700">
                {item}
                <button onClick={() => setIngredients(ingredients.filter((i) => i !== item))} className="text-gray-400 hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient() } }}
            placeholder="食材名を入力"
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm transition-colors"
          />
          <button onClick={addIngredient} className="bg-accent hover:bg-accent-dark text-white px-4 rounded-xl font-bold transition-colors active:scale-95">+</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-3">🧂 味付け・メモ <span className="text-gray-400 font-normal">(任意)</span></h3>
        <textarea
          value={seasoning}
          onChange={(e) => setSeasoning(e.target.value)}
          placeholder="例：醤油ベース、甘辛味"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">❌ {error}</p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!canSave || loading}
          className="w-full btn-gradient text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-30 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-bounce-cook inline-block">🍳</span>
              PFC推定中...
            </span>
          ) : (
            '📝 記録する'
          )}
        </button>
        <button onClick={onBack} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">キャンセル</button>
      </div>
    </div>
  )
}
