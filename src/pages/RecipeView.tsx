import { useState, useRef, useEffect, useCallback } from 'react'
import { getApiKey } from '../lib/storage'
import { addMeal, addFavorite, updateMealPFC, updateMealPhoto, addToShoppingList, addToPantry } from '../lib/db'
import PhotoCapture from '../components/PhotoCapture'
import { chatAboutRecipe, estimatePFC } from '../lib/claude'
import type { Recipe, AppMode } from '../types'

interface Props {
  recipe: Recipe
  mode: AppMode
  onBack: () => void
  onRetry: () => void
}

interface ChatMsg { role: 'bot' | 'user'; text: string }

function CookingTimer({ defaultMinutes }: { defaultMinutes: number }) {
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60)
  const [remaining, setRemaining] = useState(defaultMinutes * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false)
            setFinished(true)
            if (intervalRef.current) clearInterval(intervalRef.current)
            // vibrate if available
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, remaining])

  const toggle = () => {
    if (finished) {
      setRemaining(totalSeconds)
      setFinished(false)
      return
    }
    setRunning(!running)
  }

  const reset = () => {
    setRunning(false)
    setFinished(false)
    setRemaining(totalSeconds)
  }

  const adjust = (delta: number) => {
    if (running) return
    const newTotal = Math.max(60, totalSeconds + delta)
    setTotalSeconds(newTotal)
    setRemaining(newTotal)
    setFinished(false)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0

  return (
    <div className={`bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border transition-all ${finished ? 'border-red-300 dark:border-red-700 animate-pulse' : 'border-gray-100 dark:border-gray-700'}`}>
      <h3 className="font-bold text-lg mb-4">
        {finished ? '🔔 タイマー終了！' : '⏲️ クッキングタイマー'}
      </h3>

      <div className="relative flex items-center justify-center mb-4">
        {!running && !finished && (
          <button onClick={() => adjust(-60)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-bold active:scale-90 transition-all">-1</button>
        )}
        <div className="mx-6 text-center">
          <div className={`text-5xl font-bold font-mono tracking-wider ${finished ? 'text-red-500 animate-bounce' : running ? 'gradient-text' : ''}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          {running && (
            <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        {!running && !finished && (
          <button onClick={() => adjust(60)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-bold active:scale-90 transition-all">+1</button>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={toggle}
          className={`flex-1 max-w-40 py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition-all ${
            finished ? 'btn-gradient text-white' :
            running ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'btn-gradient text-white'
          }`}>
          {finished ? '🔄 リセット' : running ? '⏸️ 一時停止' : '▶️ スタート'}
        </button>
        {(running || (remaining < totalSeconds && !finished)) && (
          <button onClick={reset} className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium active:scale-[0.97] transition-all">
            リセット
          </button>
        )}
      </div>
    </div>
  )
}

export default function RecipeView({ recipe, onBack, onRetry }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [saved, setSaved] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [addedToList, setAddedToList] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [showTimer, setShowTimer] = useState(false)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [savedMealId, setSavedMealId] = useState<number | null>(null)
  const [photoSaved, setPhotoSaved] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatLoading])

  const toggle = (i: number) => setChecked((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const handleSave = async () => {
    const ingredientsStr = JSON.stringify(recipe.ingredients)
    const { id } = await addMeal({ recipe_name: recipe.name, category: recipe.category, ingredients: ingredientsStr })
    setSaved(true)
    setSavedMealId(id)
    setShowPhotoCapture(true)

    // パントリーに食材を追加
    for (const ing of recipe.ingredients) {
      await addToPantry(ing.name).catch(() => {})
    }

    // バックグラウンドでPFC推定
    try {
      const pfc = await estimatePFC(getApiKey(), {
        recipe_name: recipe.name,
        category: recipe.category,
        ingredients: recipe.ingredients.map((i) => `${i.name}(${i.amount})`).join('、'),
        servings: recipe.servings,
      })
      await updateMealPFC(id, pfc)
    } catch {
      // PFC推定失敗しても食事は記録済み
    }
  }

  const handlePhotoCapture = async (dataUrl: string) => {
    if (savedMealId) {
      await updateMealPhoto(savedMealId, dataUrl).catch(() => {})
    }
    setPhotoSaved(true)
    setShowPhotoCapture(false)
  }

  const handlePhotoSkip = () => {
    setShowPhotoCapture(false)
  }

  const handleFav = async () => {
    await addFavorite({ recipe_name: recipe.name, recipe_data: JSON.stringify(recipe) })
    setFavorited(true)
  }

  const handleAddToShoppingList = async () => {
    await addToShoppingList(recipe.ingredients, recipe.name)
    setAddedToList(true)
  }

  const handleShare = useCallback(async () => {
    const text = `🍽️ ${recipe.name}\n\n${recipe.description}\n\n⏱️ ${recipe.cookingTime}分 | ${recipe.difficulty} | ${recipe.servings}人分\n\n🥕 材料:\n${recipe.ingredients.map((i) => `・${i.name} ${i.amount}`).join('\n')}\n\n📝 手順:\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${recipe.tips ? `💡 ${recipe.tips}\n\n` : ''}#なにめし`

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.name, text })
        setShareMsg('共有しました！')
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      setShareMsg('コピーしました！')
    }
    setTimeout(() => setShareMsg(''), 2000)
  }, [recipe])

  const openChat = () => {
    setChatOpen(true)
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'bot', text: `🍳 「${recipe.name}」について何でも聞いてね！\n代替材料・アレンジ・コツなど、なんでもOKだよ。` }])
    }
  }

  const sendMessage = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return

    setChatInput('')
    setChatMessages((p) => [...p, { role: 'user', text: msg }])
    setChatLoading(true)
    setChatError('')

    try {
      const reply = await chatAboutRecipe(getApiKey(), recipe, chatHistory, msg)
      setChatHistory((p) => [...p, { role: 'user', content: msg }, { role: 'assistant', content: reply }])
      setChatMessages((p) => [...p, { role: 'bot', text: reply }])
    } catch (err: any) {
      const errMsg = err?.message || 'エラーが発生しました'
      setChatError(errMsg)
      setChatMessages((p) => [...p, { role: 'bot', text: `❌ ${errMsg}` }])
    } finally {
      setChatLoading(false)
    }
  }

  const dc: Record<string, string> = {
    '簡単': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    '普通': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    '本格的': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }

  const allChecked = recipe.ingredients.length > 0 && checked.size === recipe.ingredients.length
  const timerMinutes = parseInt(recipe.cookingTime) || 15

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <div className="text-center pt-2">
        <div className="text-5xl mb-3">🍽️</div>
        <h2 className="text-2xl font-bold gradient-text">{recipe.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{recipe.description}</p>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200/50 dark:border-orange-800/50 text-accent text-sm font-medium">⏱️ {recipe.cookingTime}分</span>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${dc[recipe.difficulty] || 'bg-gray-100 text-gray-700'}`}>{recipe.difficulty}</span>
        <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-300 text-sm font-medium">👥 {recipe.servings}人分</span>
        <span className="px-3 py-1.5 rounded-full bg-white dark:bg-dark-card shadow-sm text-sm border border-gray-100 dark:border-gray-700">{recipe.category}</span>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">🥕 材料</h3>
          {allChecked && <span className="text-xs text-green-600 dark:text-green-400 font-medium">全てチェック済み</span>}
        </div>
        <ul className="space-y-2.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-center gap-3">
              <button onClick={() => toggle(i)}
                className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  checked.has(i) ? 'bg-accent border-accent text-white scale-110' : 'border-gray-300 dark:border-gray-600 hover:border-accent/50'}`}>
                {checked.has(i) && <span className="text-xs">✓</span>}
              </button>
              <span className={`flex-1 text-sm transition-colors ${checked.has(i) ? 'line-through text-gray-400' : ''}`}>{ing.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4">📝 手順</h3>
        <ol className="space-y-5">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">{i + 1}</span>
              <p className="text-sm leading-relaxed pt-1 flex-1">{s}</p>
            </li>
          ))}
        </ol>
      </div>

      {recipe.tips && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4">
          <p className="text-sm leading-relaxed">💡 <strong>ワンポイント:</strong> {recipe.tips}</p>
        </div>
      )}

      {/* クッキングタイマー */}
      {!showTimer ? (
        <button onClick={() => setShowTimer(true)}
          className="w-full bg-white dark:bg-dark-card border-2 border-dashed border-teal-300/50 dark:border-teal-700/50 rounded-2xl p-4 text-center font-medium text-teal-600 dark:text-teal-400 hover:border-teal-400/80 hover:shadow-sm transition-all active:scale-[0.97]">
          ⏲️ タイマーを使う（{timerMinutes}分）
        </button>
      ) : (
        <CookingTimer defaultMinutes={timerMinutes} />
      )}

      {/* 写真撮影モーダル */}
      {showPhotoCapture && (
        <PhotoCapture onCapture={handlePhotoCapture} onSkip={handlePhotoSkip} />
      )}

      <div className="space-y-3 pt-2">
        <button onClick={handleSave} disabled={saved}
          className={`w-full font-bold py-3.5 rounded-xl transition-all ${saved ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'btn-gradient text-white'}`}>
          {saved ? (photoSaved ? '📸 写真付きで記録しました！' : '✅ 記録しました！') : '📝 食べた！'}
        </button>
        <div className="flex gap-3">
          <button onClick={onRetry} className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm">🔄 別のレシピ</button>
          <button onClick={handleFav} disabled={favorited}
            className={`flex-1 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm ${favorited ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700'}`}>
            {favorited ? '❤️ 保存済み' : '💾 お気に入り'}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddToShoppingList} disabled={addedToList}
            className={`flex-1 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm transition-all ${addedToList ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700'}`}>
            {addedToList ? '✅ リストに追加済み' : '🛒 買い物リスト'}
          </button>
          <button onClick={handleShare}
            className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-medium text-sm active:scale-[0.97] shadow-sm transition-all">
            {shareMsg || '📤 シェア'}
          </button>
        </div>
      </div>

      {/* チャットセクション */}
      {!chatOpen ? (
        <button onClick={openChat}
          className="w-full bg-white dark:bg-dark-card border-2 border-dashed border-accent/30 dark:border-accent/20 rounded-2xl p-4 text-center font-medium text-accent hover:border-accent/60 hover:shadow-sm transition-all active:scale-[0.97]">
          💬 このレシピについて質問する
        </button>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-sm">💬 シェフに質問</h3>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">閉じる</button>
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-br-md shadow-md shadow-orange-200/30 dark:shadow-orange-900/20'
                    : 'bg-gray-50 dark:bg-gray-800/50 rounded-bl-md'
                }`}>{msg.text}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-2xl rounded-bl-md">
                  <span className="text-2xl animate-bounce-cook inline-block">🍳</span>
                  <span className="text-sm ml-2 text-gray-500">考え中...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage() } }}
                placeholder="例：醤油がない場合は？"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-accent focus:outline-none text-sm transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-accent hover:bg-accent-dark text-white px-4 rounded-xl font-bold transition-colors active:scale-95 disabled:opacity-30"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">ホームに戻る</button>
    </div>
  )
}
