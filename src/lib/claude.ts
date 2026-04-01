import type { Recipe, AppMode, PFC } from '../types'

const BASE_SYSTEM_PROMPT = `あなたは料理アドバイザーの「なにめしシェフ」です。
ユーザーの食材・気分・調理時間に合わせて、家庭で作りやすいレシピを1つ提案してください。
以下のJSON形式で回答してください：
{
  "name": "レシピ名",
  "description": "一言説明",
  "cookingTime": "調理時間（分）",
  "difficulty": "簡単 | 普通 | 本格的",
  "servings": 人数,
  "category": "肉料理 | 魚料理 | 野菜料理 | 麺類 | ご飯もの | スープ | その他",
  "ingredients": [
    { "name": "食材名", "amount": "分量" }
  ],
  "steps": [
    "手順1（具体的な火加減・時間・切り方・調味料の量を含む）",
    "手順2"
  ],
  "tips": "ワンポイントアドバイス"
}

【重要】stepsは料理初心者が見ただけで迷わず作れるレベルで詳細に書いてください：

■ 下準備の手順を必ず含める
- 食材の洗い方（「流水でさっと洗う」「ため水で洗う」など）
- 切り方はサイズまで具体的に（「薄切り＝厚さ約3mm」「一口大＝約2〜3cm角」「みじん切り＝約2mm角」）
- 下味の付け方（「ボウルに入れ、塩小さじ1/2をふって5分おく」など）
- アク抜きや水切りが必要な場合はその方法も記載

■ 調理の手順
- 火加減は必ず記載（弱火・中火・強火）
- 加熱時間の目安を必ず記載（「約2分」「30秒ほど」）
- 調味料は手順の中にも分量を書く（「しょうゆ大さじ1、みりん大さじ1を加える」）
- 油の種類と量も明記（「サラダ油大さじ1をフライパンに入れ中火で熱する」）
- 完成の見た目の目安（「表面がきつね色になったら裏返す」「全体にとろみがついたら火を止める」）
- 混ぜ方の指示（「木べらで底からすくうように混ぜる」「菜箸でほぐしながら炒める」）

■ 盛り付け
- 最後に盛り付けの指示を入れる（「器に盛り、小ねぎを散らして完成」など）

■ 全体
- 6〜10手順程度で記載
- 1つの手順には1〜2つの作業にまとめる（長すぎない）

JSONのみ出力し、それ以外のテキストは含めないでください。`

const LAZY_ADDITION = `\n包丁を使わない、調理時間5分以内、洗い物が少ないレシピに限定してください。電子レンジ調理を優先してください。`

function getSeasonContext(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return '春（旬の食材: 新玉ねぎ、たけのこ、菜の花、春キャベツ、アスパラガス、いちご）'
  if (month >= 6 && month <= 8) return '夏（旬の食材: トマト、きゅうり、ナス、枝豆、とうもろこし、スイカ、冷たい料理がおすすめ）'
  if (month >= 9 && month <= 11) return '秋（旬の食材: さつまいも、きのこ類、栗、かぼちゃ、秋刀魚、梨）'
  return '冬（旬の食材: 白菜、大根、ほうれん草、ブロッコリー、みかん、鍋料理がおすすめ）'
}

function getTimeContext(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return '朝食向け（軽めで栄養のある料理）'
  if (hour >= 10 && hour < 15) return '昼食向け（しっかり食べられる料理）'
  if (hour >= 15 && hour < 17) return 'おやつ・軽食向け'
  return '夕食向け（メインディッシュ）'
}

function buildUserMessage(params: {
  ingredients?: string[]
  mood?: string
  cookingTime?: string
  servings?: number
  mode: AppMode
  recentMeals?: string[]
}): string {
  const parts: string[] = []

  parts.push(`季節: ${getSeasonContext()}`)
  parts.push(`時間帯: ${getTimeContext()}`)

  if (params.mode === 'lazy') {
    parts.push('手抜きモードでお願いします。包丁なし・5分以内の超簡単レシピをお願いします。')
  } else if (params.mode === 'random') {
    parts.push('おまかせでレシピを1つ提案してください。')
  } else if (params.mode === 'suggest') {
    parts.push('今日のおすすめレシピを1つ提案してください。季節の旬の食材を活かし、時間帯に合った料理にしてください。最近の食事と栄養バランスを考慮して、バリエーション豊かな提案をお願いします。')
  }

  if (params.ingredients && params.ingredients.length > 0) {
    parts.push(`冷蔵庫にある食材: ${params.ingredients.join('、')}`)
  }
  if (params.mood) {
    parts.push(`今日の気分: ${params.mood}`)
  }
  if (params.cookingTime) {
    parts.push(`調理時間: ${params.cookingTime}`)
  }
  if (params.servings) {
    parts.push(`人数: ${params.servings}人分`)
  }
  if (params.recentMeals && params.recentMeals.length > 0) {
    parts.push(`最近食べたもの: ${params.recentMeals.join('、')}`)
    parts.push('最近の食事と被らない、栄養バランスを考慮したレシピをお願いします。')
  }

  return parts.join('\n')
}

export async function requestRecipe(
  apiKey: string,
  params: {
    ingredients?: string[]
    mood?: string
    cookingTime?: string
    servings?: number
    mode: AppMode
    recentMeals?: string[]
  }
): Promise<Recipe> {
  let systemPrompt = BASE_SYSTEM_PROMPT
  if (params.mode === 'lazy') {
    systemPrompt += LAZY_ADDITION
  }

  const userMessage = buildUserMessage(params)

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('⚠️ APIキーが正しくありません。設定を確認してください')
    }
    if (res.status === 429) {
      throw new Error('🕐 リクエスト制限中です。30秒ほど待ってからリトライしてください')
    }
    throw new Error(`APIエラーが発生しました（${res.status}）`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('レスポンスにテキストが含まれていません')
  }

  let jsonStr = text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  if (!jsonStr.startsWith('{')) {
    const match = jsonStr.match(/\{[\s\S]*\}/)
    if (match) jsonStr = match[0]
  }

  try {
    return JSON.parse(jsonStr)
  } catch {
    throw new Error('レシピのJSON解析に失敗しました')
  }
}

export async function chatAboutRecipe(
  apiKey: string,
  recipe: Recipe,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `あなたは料理アドバイザーの「なにめしシェフ」です。
ユーザーが今見ているレシピについての質問に答えてください。

【現在のレシピ】
料理名: ${recipe.name}
説明: ${recipe.description}
調理時間: ${recipe.cookingTime}分
難易度: ${recipe.difficulty}
人数: ${recipe.servings}人分
カテゴリ: ${recipe.category}
材料: ${recipe.ingredients.map((i) => `${i.name}(${i.amount})`).join('、')}
手順: ${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${recipe.tips ? `ワンポイント: ${recipe.tips}` : ''}

ユーザーの質問に対して、親切に・具体的に回答してください。
代替材料の提案、アレンジ方法、コツの説明など幅広く対応してください。
回答は簡潔にまとめてください（長すぎないように）。`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history,
    { role: 'user' as const, content: userMessage },
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('⚠️ APIキーが正しくありません')
    }
    if (res.status === 429) {
      throw new Error('🕐 リクエスト制限中です。少し待ってからリトライしてください')
    }
    throw new Error(`APIエラーが発生しました（${res.status}）`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('回答を取得できませんでした')
  }

  return text.trim()
}

export async function estimatePFC(
  apiKey: string,
  params: {
    recipe_name: string
    category: string
    ingredients?: string
    servings?: number
  }
): Promise<PFC> {
  const systemPrompt = `あなたは管理栄養士です。料理名と材料から、1人前あたりの栄養素を正確に推定してください。

【重要な計算ルール】
■ 材料に分量（g、ml、個、本、枚、大さじ、小さじ等）が記載されている場合は、その量をベースに栄養素を計算すること
■ 人数分の材料が記載されている場合は、1人前に換算すること
■ 調理法を考慮すること（揚げ物は吸油分の脂質を加算、茹では水溶性栄養素の減少を考慮）
■ 調味料（砂糖、みりん、小麦粉等）の糖質・脂質も加算すること
■ 油で調理する場合は使用する油の脂質も加算すること

【栄養素の目安（100gあたり）】
- 鶏むね肉: P23g F1.5g C0g 108kcal
- 鶏もも肉: P16g F14g C0g 200kcal
- 豚バラ肉: P14g F35g C0g 386kcal
- 豚ロース: P19g F19g C0g 263kcal
- 牛肉(肩ロース): P17g F26g C0g 316kcal
- 鮭: P20g F4g C0g 133kcal
- 白米(炊飯後): P2.5g F0.3g C37g 168kcal
- パスタ(茹で): P5g F1g C28g 149kcal
- 卵1個(60g): P7g F6g C0.2g 85kcal
- 豆腐(100g): P7g F4g C2g 72kcal
- サラダ油(大さじ1=13g): 120kcal F13g

以下のJSON形式で回答してください：
{
  "protein": 数値(グラム),
  "fat": 数値(グラム),
  "carbs": 数値(グラム),
  "calories": 数値(kcal)
}

JSONのみ出力し、それ以外のテキストは含めないでください。`

  let userMessage = `料理名: ${params.recipe_name}\nカテゴリ: ${params.category}`
  if (params.ingredients) {
    userMessage += `\n材料: ${params.ingredients}`
  }
  if (params.servings) {
    userMessage += `\n人数: ${params.servings}人分（1人前の栄養素を回答してください）`
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 256,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('APIキーが正しくありません')
    if (res.status === 429) throw new Error('リクエスト制限中です。少し待ってください')
    throw new Error(`APIエラー（${res.status}）`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('PFC推定の応答が空です')

  let jsonStr = text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  if (!jsonStr.startsWith('{')) {
    const match = jsonStr.match(/\{[\s\S]*\}/)
    if (match) jsonStr = match[0]
  }

  const parsed = JSON.parse(jsonStr)
  return {
    protein: Math.round(parsed.protein ?? 0),
    fat: Math.round(parsed.fat ?? 0),
    carbs: Math.round(parsed.carbs ?? 0),
    calories: Math.round(parsed.calories ?? 0),
  }
}
