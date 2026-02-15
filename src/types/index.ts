export type Category = '肉料理' | '魚料理' | '野菜料理' | '麺類' | 'ご飯もの' | 'スープ' | 'その他'

export interface PFC {
  protein: number   // grams
  fat: number       // grams
  carbs: number     // grams
  calories: number  // kcal
}

export interface Recipe {
  name: string
  description: string
  cookingTime: string
  difficulty: '簡単' | '普通' | '本格的'
  servings: number
  category: Category
  ingredients: Ingredient[]
  steps: string[]
  tips: string
}

export interface Ingredient {
  name: string
  amount: string
}

export interface Meal {
  id: number
  recipe_name: string
  category: string
  ingredients: string
  cooked_at: string
  pfc?: PFC | null
  is_manual?: boolean
}

export interface Favorite {
  id: number
  recipe_name: string
  recipe_data: string
  created_at: string
}

export interface ShoppingItem {
  id: number
  name: string
  amount: string
  checked: boolean
  recipe_name?: string
}

export type AppMode = 'consult' | 'random' | 'lazy'
export type Mood = 'がっつり' | 'あっさり' | '辛いもの' | '甘いもの' | 'ヘルシー'
export type CookingTime = '5分以内' | '15分' | '30分' | '時間気にしない'
