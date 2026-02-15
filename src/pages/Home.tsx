import type { AppMode } from '../types'

const modes = [
  { id: 'consult' as AppMode, emoji: '🗣️', title: '相談する', description: '食材や気分を教えてね。ぴったりのレシピを提案するよ！', color: 'from-orange-400 to-amber-400', shadow: 'shadow-orange-200/50 dark:shadow-orange-900/30' },
  { id: 'random' as AppMode, emoji: '🎲', title: 'おまかせ', description: '何も考えたくない日に。ランダムにレシピを提案！', color: 'from-pink-400 to-rose-400', shadow: 'shadow-pink-200/50 dark:shadow-pink-900/30' },
  { id: 'lazy' as AppMode, emoji: '😴', title: '手抜きモード', description: '包丁なし・5分以内！超簡単レシピだけ。', color: 'from-teal-400 to-emerald-400', shadow: 'shadow-teal-200/50 dark:shadow-teal-900/30' },
]

export default function Home({ onSelectMode, onOpenHistory, onOpenManualEntry, onOpenShoppingList }: { onSelectMode: (m: AppMode) => void; onOpenHistory: () => void; onOpenManualEntry: () => void; onOpenShoppingList: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10 pt-4">
        <div className="text-5xl mb-3 animate-float">🍚</div>
        <h1 className="text-4xl font-bold gradient-text mb-1">なにめし</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">今日は何食べる？</p>
      </div>
      <div className="space-y-4 mb-8">
        {modes.map((m, i) => (
          <button key={m.id} onClick={() => onSelectMode(m.id)}
            className={`w-full text-left bg-white dark:bg-dark-card rounded-2xl p-5 shadow-md ${m.shadow} hover:shadow-lg transition-all active:scale-[0.97] border border-gray-100 dark:border-gray-700 animate-scale-in stagger-${i + 1}`}>
            <div className="flex items-start gap-4">
              <div className={`text-3xl w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {m.emoji}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{m.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed">{m.description}</p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-lg mt-1">›</span>
            </div>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <button onClick={onOpenShoppingList}
          className="w-full bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 text-center font-medium active:scale-[0.97]">
          🛒 買い物リスト
        </button>
        <button onClick={onOpenManualEntry}
          className="w-full bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 text-center font-medium active:scale-[0.97]">
          ✏️ 食事を手動で記録
        </button>
        <button onClick={onOpenHistory}
          className="w-full bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 text-center font-medium active:scale-[0.97]">
          📖 食事履歴
        </button>
      </div>
    </div>
  )
}
