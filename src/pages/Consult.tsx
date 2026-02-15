import { useState, useRef, useEffect } from 'react'
import { getApiKey, getMeals } from '../lib/storage'
import { requestRecipe } from '../lib/claude'
import type { AppMode, Mood, CookingTime, Recipe } from '../types'

interface Props {
  mode: AppMode
  onRecipeReady: (recipe: Recipe) => void
  onBack: () => void
}

const moods: { label: Mood; emoji: string }[] = [
  { label: 'がっつり', emoji: '🥩' }, { label: 'あっさり', emoji: '🥗' },
  { label: '辛いもの', emoji: '🌶️' }, { label: '甘いもの', emoji: '🍰' }, { label: 'ヘルシー', emoji: '💚' },
]

const cookingTimes: { label: CookingTime; emoji: string }[] = [
  { label: '5分以内', emoji: '⚡' }, { label: '15分', emoji: '⏱️' },
  { label: '30分', emoji: '🕐' }, { label: '時間気にしない', emoji: '🍲' },
]

interface ChatMsg { role: 'bot' | 'user'; text: string }

export default function Consult({ mode, onRecipeReady, onBack }: Props) {
  const [step, setStep] = useState(mode === 'consult' ? 0 : -1)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [cookingTime, setCookingTime] = useState<CookingTime | null>(null)
  const [servings, setServings] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ユーザーが操作してメッセージが増えた時だけスクロール（初回の1件目ではスクロールしない）
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, step, loading])

  useEffect(() => {
    if (mode === 'consult') {
      setMessages([{ role: 'bot', text: '🍳 こんにちは！なにめしシェフです。\n冷蔵庫に何がありますか？' }])
    } else if (mode === 'random') {
      setMessages([{ role: 'bot', text: '🎲 おまかせモード！\nランダムにレシピを提案するよ。ちょっと待ってね...' }])
      fetchRecipe({ mode: 'random' })
    } else {
      setMessages([{ role: 'bot', text: '😴 手抜きモード！\n包丁なし・5分以内の簡単レシピを探すよ...' }])
      fetchRecipe({ mode: 'lazy' })
    }
  }, [])

  const addIngredient = () => {
    const t = ingredientInput.trim()
    if (t && !ingredients.includes(t)) { setIngredients([...ingredients, t]); setIngredientInput('') }
  }

  const confirmIngredients = () => {
    if (ingredients.length === 0) return
    setMessages((p) => [...p, { role: 'user', text: ingredients.join('、') }, { role: 'bot', text: '🤔 今日の気分は？' }])
    setStep(1)
  }

  const selectMood = (m: Mood) => {
    setMood(m)
    setMessages((p) => [...p, { role: 'user', text: m }, { role: 'bot', text: '⏰ 調理時間はどのくらい？' }])
    setStep(2)
  }

  const selectCookingTime = (t: CookingTime) => {
    setCookingTime(t)
    setMessages((p) => [...p, { role: 'user', text: t }, { role: 'bot', text: '👥 何人分？' }])
    setStep(3)
  }

  const confirmServings = () => {
    setMessages((p) => [...p, { role: 'user', text: `${servings}人分` }, { role: 'bot', text: '🍳 レシピを考え中...' }])
    setStep(4)
    fetchRecipe({ mode: 'consult', ingredients, mood: mood ?? undefined, cookingTime: cookingTime ?? undefined, servings })
  }

  const fetchRecipe = async (params: { mode: AppMode; ingredients?: string[]; mood?: string; cookingTime?: string; servings?: number }) => {
    setLoading(true); setError('')
    try {
      const recent = getMeals(7).map((m) => m.recipe_name)
      const recipe = await requestRecipe(getApiKey(), { ...params, recentMeals: recent.length > 0 ? recent : undefined })
      onRecipeReady(recipe)
    } catch (err: any) {
      const msg = err?.message || 'エラーが発生しました'
      setError(msg)
      setMessages((p) => [...p, { role: 'bot', text: `❌ ${msg}` }])
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-br-md shadow-md shadow-orange-200/30 dark:shadow-orange-900/20'
                : 'bg-white dark:bg-dark-card rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
            }`}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="text-2xl animate-bounce-cook inline-block">🍳</span>
              <span className="text-sm ml-2 text-gray-500">レシピを考え中...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-cream dark:bg-dark-bg pt-2 pb-4">
        {step === 0 && !loading && (
          <div className="space-y-3">
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((item) => (
                  <span key={item} className="bg-white dark:bg-dark-card px-3 py-1.5 rounded-full text-sm shadow-sm flex items-center gap-1 border border-gray-100 dark:border-gray-700">
                    {item}
                    <button onClick={() => setIngredients(ingredients.filter((i) => i !== item))} className="text-gray-400 hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient() } }}
                placeholder="食材を入力（例：鶏肉）"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-card focus:border-accent focus:outline-none text-sm transition-colors" />
              <button onClick={addIngredient} className="bg-accent hover:bg-accent-dark text-white px-4 rounded-xl font-bold transition-colors active:scale-95">+</button>
            </div>
            <button onClick={confirmIngredients} disabled={ingredients.length === 0}
              className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all disabled:opacity-30 disabled:shadow-none">次へ →</button>
          </div>
        )}

        {step === 1 && !loading && (
          <div className="grid grid-cols-2 gap-2">
            {moods.map((m) => (
              <button key={m.label} onClick={() => selectMood(m.label)}
                className="bg-white dark:bg-dark-card p-3.5 rounded-xl shadow-sm text-sm font-medium active:scale-[0.95] transition-all border border-gray-100 dark:border-gray-700 hover:shadow-md">
                <span className="text-xl mr-1">{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && !loading && (
          <div className="grid grid-cols-2 gap-2">
            {cookingTimes.map((t) => (
              <button key={t.label} onClick={() => selectCookingTime(t.label)}
                className="bg-white dark:bg-dark-card p-3.5 rounded-xl shadow-sm text-sm font-medium active:scale-[0.95] transition-all border border-gray-100 dark:border-gray-700 hover:shadow-md">
                <span className="text-xl mr-1">{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        )}

        {step === 3 && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-12 h-12 bg-white dark:bg-dark-card rounded-2xl shadow-sm text-lg font-bold active:scale-90 transition-all border border-gray-100 dark:border-gray-700">-</button>
              <span className="text-4xl font-bold gradient-text">{servings}</span>
              <button onClick={() => setServings(Math.min(5, servings + 1))} className="w-12 h-12 bg-white dark:bg-dark-card rounded-2xl shadow-sm text-lg font-bold active:scale-90 transition-all border border-gray-100 dark:border-gray-700">+</button>
            </div>
            <p className="text-center text-gray-500 text-sm">{servings}人分</p>
            <button onClick={confirmServings} className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all">
              レシピを提案して！ 🍳
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="space-y-2">
            <button onClick={() => { setError(''); mode === 'consult' ? confirmServings() : fetchRecipe({ mode }) }}
              className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all">🔄 リトライ</button>
            <button onClick={onBack} className="w-full text-gray-500 text-sm py-2">ホームに戻る</button>
          </div>
        )}
      </div>
    </div>
  )
}
