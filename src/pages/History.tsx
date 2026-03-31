import { useState, useEffect, useMemo } from 'react'
import { getMeals, getPFCGoals } from '../lib/db'
import type { Meal, PFCGoals } from '../types'

function GoalProgress({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min(100, Math.round((current / goal) * 100))
  const over = current > goal
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className={`font-medium ${over ? 'text-red-500' : pct >= 80 ? 'text-green-600' : ''}`}>{current} / {goal}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-400' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function History({ onOpenManualEntry }: { onOpenManualEntry: () => void }) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [goals, setGoals] = useState<PFCGoals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMeals(200), getPFCGoals()])
      .then(([m, g]) => { setMeals(m); setGoals(g) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const mealsByDate = useMemo(() => {
    const map: Record<string, Meal[]> = {}
    meals.forEach((m) => { const d = m.cooked_at.split('T')[0]; if (!map[d]) map[d] = []; map[d].push(m) })
    return map
  }, [meals])

  // 連続記録日数
  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (mealsByDate[key]) count++
      else break
    }
    return count
  }, [mealsByDate])

  const weekStats = useMemo(() => {
    const ago = new Date(); ago.setDate(ago.getDate() - 7)
    const recent = meals.filter((m) => new Date(m.cooked_at) >= ago)
    const counts = { '肉料理': 0, '魚料理': 0, '野菜料理': 0, 'その他': 0 }
    recent.forEach((m) => {
      if (m.category === '肉料理') counts['肉料理']++
      else if (m.category === '魚料理') counts['魚料理']++
      else if (m.category === '野菜料理') counts['野菜料理']++
      else counts['その他']++
    })
    return { counts, total: recent.length || 1 }
  }, [meals])

  const balanceComment = useMemo(() => {
    const { counts } = weekStats
    if (counts['肉料理'] > counts['魚料理'] + counts['野菜料理']) return '🐟 最近お肉が多めです。今日は魚料理はいかが？'
    if (counts['野菜料理'] === 0 && weekStats.total > 2) return '🥬 野菜料理が少なめです。今日はサラダやスープはいかが？'
    if (counts['魚料理'] === 0 && weekStats.total > 2) return '🐟 魚料理がまだないですね。今日は魚にしてみませんか？'
    return '✨ バランスよく食べていますね！'
  }, [weekStats])

  // 週間PFCサマリー
  const weeklyPFC = useMemo(() => {
    const ago = new Date(); ago.setDate(ago.getDate() - 7)
    const recent = meals.filter((m) => new Date(m.cooked_at) >= ago && m.pfc)
    if (recent.length === 0) return null

    const totals = recent.reduce(
      (acc, m) => ({
        protein: acc.protein + (m.pfc?.protein ?? 0),
        fat: acc.fat + (m.pfc?.fat ?? 0),
        carbs: acc.carbs + (m.pfc?.carbs ?? 0),
        calories: acc.calories + (m.pfc?.calories ?? 0),
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    )

    const days = 7
    return {
      avgProtein: Math.round(totals.protein / days),
      avgFat: Math.round(totals.fat / days),
      avgCarbs: Math.round(totals.carbs / days),
      avgCalories: Math.round(totals.calories / days),
      totalMeals: recent.length,
    }
  }, [meals])

  const pfcComment = useMemo(() => {
    if (!weeklyPFC) return null
    const { avgProtein, avgFat, avgCarbs } = weeklyPFC
    const total = avgProtein + avgFat + avgCarbs
    if (total === 0) return null

    const pRatio = avgProtein / total
    const fRatio = avgFat / total
    const cRatio = avgCarbs / total

    if (pRatio > 0.35) return '💪 タンパク質が多めです。バランスに気をつけましょう'
    if (fRatio > 0.35) return '🧈 脂質が多めです。あっさりした料理も取り入れてみましょう'
    if (cRatio > 0.70) return '🍚 炭水化物が多めです。おかずを増やしてみましょう'
    if (pRatio < 0.10) return '🥚 タンパク質が少なめです。肉・魚・卵を意識してみましょう'
    return '✨ PFCバランスが良好です！'
  }, [weeklyPFC])

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [currentMonth])

  const fmtDate = (day: number) => {
    const { year, month } = currentMonth
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedMeals = selectedDate ? mealsByDate[selectedDate] || [] : []

  const barColors: Record<string, string> = { '肉料理': 'from-red-400 to-rose-400', '魚料理': 'from-blue-400 to-cyan-400', '野菜料理': 'from-green-400 to-emerald-400' }
  const barEmojis: Record<string, string> = { '肉料理': '🥩', '魚料理': '🐟', '野菜料理': '🥬' }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-2xl animate-bounce-cook">🍙</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5 pb-16">
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold gradient-text">食事履歴</h2>
        {streak > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            🔥 {streak}日連続記録中！
          </p>
        )}
      </div>

      {/* カテゴリバランス */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm mb-4">最近1週間のまとめ</h3>
        <div className="space-y-3 mb-4">
          {(['肉料理', '魚料理', '野菜料理'] as const).map((cat) => {
            const count = weekStats.counts[cat]; const pct = Math.round((count / weekStats.total) * 100)
            return (
              <div key={cat} className="flex items-center gap-2 text-sm">
                <span className="w-16">{barEmojis[cat]} {cat.replace('料理', '')}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${barColors[cat]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500 font-medium">{count}</span>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">{balanceComment}</p>
      </div>

      {/* PFCバランス */}
      {weeklyPFC && (
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-sm mb-4">📊 PFCバランス <span className="text-xs text-gray-400 font-normal">(1日平均 / AI推定)</span></h3>

          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {(() => {
              const total = weeklyPFC.avgProtein + weeklyPFC.avgFat + weeklyPFC.avgCarbs
              if (total === 0) return null
              return (
                <>
                  <div className="bg-blue-400" style={{ width: `${(weeklyPFC.avgProtein / total) * 100}%` }} />
                  <div className="bg-yellow-400" style={{ width: `${(weeklyPFC.avgFat / total) * 100}%` }} />
                  <div className="bg-green-400" style={{ width: `${(weeklyPFC.avgCarbs / total) * 100}%` }} />
                </>
              )
            })()}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-500">P</span>
              </div>
              <span className="text-lg font-bold">{weeklyPFC.avgProtein}</span>
              <span className="text-xs text-gray-400">g</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="text-xs text-gray-500">F</span>
              </div>
              <span className="text-lg font-bold">{weeklyPFC.avgFat}</span>
              <span className="text-xs text-gray-400">g</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500">C</span>
              </div>
              <span className="text-lg font-bold">{weeklyPFC.avgCarbs}</span>
              <span className="text-xs text-gray-400">g</span>
            </div>
          </div>

          <div className="text-center mb-3">
            <span className="text-2xl font-bold gradient-text">{weeklyPFC.avgCalories}</span>
            <span className="text-sm text-gray-500 ml-1">kcal/日</span>
          </div>

          {/* 目標との比較 */}
          {goals && (
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-500 mb-2">🎯 目標との比較（1日平均）</h4>
              <GoalProgress label="カロリー" current={weeklyPFC.avgCalories} goal={goals.calories} color="bg-gradient-to-r from-orange-400 to-amber-400" />
              <GoalProgress label="タンパク質" current={weeklyPFC.avgProtein} goal={goals.protein} color="bg-blue-400" />
              <GoalProgress label="脂質" current={weeklyPFC.avgFat} goal={goals.fat} color="bg-yellow-400" />
              <GoalProgress label="炭水化物" current={weeklyPFC.avgCarbs} goal={goals.carbs} color="bg-green-400" />
            </div>
          )}

          {pfcComment && (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mt-3">{pfcComment}</p>
          )}
        </div>
      )}

      {/* カレンダー */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm active:scale-90 transition-all">◀</button>
          <h3 className="font-bold text-lg">{currentMonth.year}年 {currentMonth.month + 1}月</h3>
          <button onClick={() => setCurrentMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm active:scale-90 transition-all">▶</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
            <div key={d} className="text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} />
            const dk = fmtDate(day); const has = !!mealsByDate[dk]; const sel = selectedDate === dk
            return (
              <button key={i} onClick={() => setSelectedDate(sel ? null : dk)}
                className={`relative w-full aspect-square flex items-center justify-center rounded-xl text-sm transition-all ${
                  sel ? 'bg-gradient-to-br from-orange-400 to-amber-400 text-white font-bold shadow-sm' : has ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {day}
                {has && !sel && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 選択日の食事 */}
      {selectedDate && (
        <div className="animate-slide-in space-y-2">
          <h3 className="font-bold text-sm px-1">{selectedDate} の食事</h3>
          {selectedMeals.length === 0 ? <p className="text-gray-500 text-sm px-1">この日の記録はありません</p> :
            selectedMeals.map((meal) => (
              <div key={meal.id} className="bg-white dark:bg-dark-card rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {meal.is_manual && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">手動</span>}
                    <span className="font-medium text-sm">{meal.recipe_name}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">{meal.category}</span>
                </div>
                {meal.pfc && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        P {meal.pfc.protein}g
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        F {meal.pfc.fat}g
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        C {meal.pfc.carbs}g
                      </span>
                      <span className="ml-auto font-medium">{meal.pfc.calories}kcal</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden mt-1.5">
                      {(() => {
                        const total = meal.pfc.protein + meal.pfc.fat + meal.pfc.carbs
                        if (total === 0) return null
                        return (
                          <>
                            <div className="bg-blue-400" style={{ width: `${(meal.pfc.protein / total) * 100}%` }} />
                            <div className="bg-yellow-400" style={{ width: `${(meal.pfc.fat / total) * 100}%` }} />
                            <div className="bg-green-400" style={{ width: `${(meal.pfc.carbs / total) * 100}%` }} />
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {meals.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-5xl mb-3">🍽️</p>
          <p className="text-sm">まだ食事の記録がありません</p>
        </div>
      )}

      {/* FABボタン */}
      <button
        onClick={onOpenManualEntry}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 text-white rounded-full shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30 flex items-center justify-center text-2xl active:scale-90 transition-all z-10"
      >
        +
      </button>
    </div>
  )
}
