import { useState, useRef } from 'react'

interface Props {
  onCapture: (dataUrl: string) => void
  onSkip: () => void
}

export default function PhotoCapture({ onCapture, onSkip }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Resize to max 800px for storage efficiency
        const maxSize = 800
        let w = img.width
        let h = img.height
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize }
          else { w = Math.round((w * maxSize) / h); h = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        setPreview(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="animate-scale-in space-y-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-3 text-center">📸 料理の写真を撮ろう！</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">完成した料理を写真に残そう</p>

        {!preview ? (
          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-12 rounded-2xl border-2 border-dashed border-accent/40 hover:border-accent/70 text-accent transition-all active:scale-[0.97] flex flex-col items-center gap-2"
            >
              <span className="text-4xl">📷</span>
              <span className="font-medium text-sm">タップして撮影・選択</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="料理の写真" className="w-full aspect-[4/3] object-cover" />
              <button
                onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-sm backdrop-blur-sm"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => onCapture(preview)}
              className="w-full btn-gradient text-white font-bold py-3 rounded-xl transition-all"
            >
              この写真で保存
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onSkip}
        className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
      >
        スキップ（写真なし）
      </button>
    </div>
  )
}
