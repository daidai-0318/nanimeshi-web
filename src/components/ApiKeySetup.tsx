import { useState } from 'react'
import { setApiKey } from '../lib/storage'

export default function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimmed = key.trim()
    if (!trimmed) { setError('APIキーを入力してください'); return }
    if (!trimmed.startsWith('gsk_')) { setError('正しいGroq APIキーを入力してください（gsk_で始まります）'); return }
    setApiKey(trimmed)
    onComplete()
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg flex flex-col items-center justify-center px-6">
      <div className="text-6xl mb-4">🍙</div>
      <h1 className="text-3xl font-bold text-accent mb-2">なにめし</h1>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 text-center">
        はじめに、APIキーを設定してください
      </p>

      <div className="w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm mb-6">
        <h3 className="font-bold text-sm mb-3">📝 APIキーの取得手順（無料・3分）</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
                className="text-accent underline font-medium">console.groq.com</a> にアクセス
              <p className="text-gray-400 dark:text-gray-500 mt-0.5">※ Groqは高速AIサービスです</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-600 dark:text-gray-300">アカウント作成・ログイン</span>
              <p className="text-gray-400 dark:text-gray-500 mt-0.5">「Sign Up」→ Googleアカウントでログインが簡単です。クレジットカード不要・完全無料です</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-600 dark:text-gray-300">APIキーを作成</span>
              <p className="text-gray-400 dark:text-gray-500 mt-0.5">ログイン後、左メニューの「API Keys」→「Create API Key」をタップ。名前は何でもOK（例: なにめし）、Expirationはそのままで「Submit」</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">4</span>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-600 dark:text-gray-300">キーをコピーして下に貼り付け</span>
              <p className="text-gray-400 dark:text-gray-500 mt-0.5"><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">gsk_</code> で始まる長い文字列です。コピーボタンを押してコピーしてください</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-4 font-medium text-center">
          🎉 完全無料で1日14,400回まで使えます
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="gsk_..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-card focus:border-accent focus:outline-none text-sm"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button onClick={handleSubmit} className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-xl transition-colors">
          設定して始める
        </button>
        <p className="text-gray-400 text-xs text-center">APIキーはこのデバイスのみに保存されます</p>
      </div>
    </div>
  )
}
