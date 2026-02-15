import type { Meal, Favorite, PFC, ShoppingItem, Ingredient } from '../types'

// --- API Key ---
export function getApiKey(): string {
  return localStorage.getItem('nanimeshi-api-key') || ''
}

export function setApiKey(key: string) {
  localStorage.setItem('nanimeshi-api-key', key)
}

export function removeApiKey() {
  localStorage.removeItem('nanimeshi-api-key')
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

// --- Meals ---
function getMealsData(): Meal[] {
  const raw = localStorage.getItem('nanimeshi-meals')
  return raw ? JSON.parse(raw) : []
}

function saveMealsData(meals: Meal[]) {
  localStorage.setItem('nanimeshi-meals', JSON.stringify(meals))
}

let mealIdCounter = 0

export function addMeal(meal: {
  recipe_name: string
  category: string
  ingredients: string
  pfc?: PFC | null
  is_manual?: boolean
}): { id: number } {
  const meals = getMealsData()
  const id = Date.now() + mealIdCounter++
  meals.unshift({
    id,
    recipe_name: meal.recipe_name,
    category: meal.category,
    ingredients: meal.ingredients,
    cooked_at: new Date().toISOString(),
    pfc: meal.pfc ?? null,
    is_manual: meal.is_manual ?? false,
  })
  saveMealsData(meals)
  return { id }
}

export function updateMealPFC(mealId: number, pfc: PFC): void {
  const meals = getMealsData()
  const meal = meals.find((m) => m.id === mealId)
  if (meal) {
    meal.pfc = pfc
    saveMealsData(meals)
  }
}

export function getMeals(limit = 100): Meal[] {
  return getMealsData().slice(0, limit)
}

// --- Favorites ---
function getFavoritesData(): Favorite[] {
  const raw = localStorage.getItem('nanimeshi-favorites')
  return raw ? JSON.parse(raw) : []
}

function saveFavoritesData(favorites: Favorite[]) {
  localStorage.setItem('nanimeshi-favorites', JSON.stringify(favorites))
}

let favIdCounter = 0

export function addFavorite(fav: { recipe_name: string; recipe_data: string }): { id: number } {
  const favorites = getFavoritesData()
  const id = Date.now() + favIdCounter++
  favorites.unshift({
    id,
    recipe_name: fav.recipe_name,
    recipe_data: fav.recipe_data,
    created_at: new Date().toISOString(),
  })
  saveFavoritesData(favorites)
  return { id }
}

export function getFavorites(): Favorite[] {
  return getFavoritesData()
}

export function removeFavorite(id: number) {
  const favorites = getFavoritesData().filter((f) => f.id !== id)
  saveFavoritesData(favorites)
}

// --- Shopping List ---
function getShoppingData(): ShoppingItem[] {
  const raw = localStorage.getItem('nanimeshi-shopping')
  return raw ? JSON.parse(raw) : []
}

function saveShoppingData(items: ShoppingItem[]) {
  localStorage.setItem('nanimeshi-shopping', JSON.stringify(items))
}

let shopIdCounter = 0

export function getShoppingList(): ShoppingItem[] {
  return getShoppingData()
}

export function addToShoppingList(ingredients: Ingredient[], recipeName?: string): void {
  const items = getShoppingData()
  for (const ing of ingredients) {
    const existing = items.find((item) => item.name === ing.name && !item.checked)
    if (existing) {
      // 同じ食材がある場合は量を追記
      if (ing.amount && existing.amount && !existing.amount.includes(ing.amount)) {
        existing.amount += ` + ${ing.amount}`
      }
    } else {
      items.push({
        id: Date.now() + shopIdCounter++,
        name: ing.name,
        amount: ing.amount,
        checked: false,
        recipe_name: recipeName,
      })
    }
  }
  saveShoppingData(items)
}

export function toggleShoppingItem(id: number): void {
  const items = getShoppingData()
  const item = items.find((i) => i.id === id)
  if (item) {
    item.checked = !item.checked
    saveShoppingData(items)
  }
}

export function removeShoppingItem(id: number): void {
  const items = getShoppingData().filter((i) => i.id !== id)
  saveShoppingData(items)
}

export function clearShoppingList(): void {
  localStorage.removeItem('nanimeshi-shopping')
}
