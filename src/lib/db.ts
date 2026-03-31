import { supabase } from './supabase'
import type { Meal, Favorite, PFC, PFCGoals, ShoppingItem, Ingredient } from '../types'

// --- Meals ---
export async function addMeal(meal: {
  recipe_name: string
  category: string
  ingredients: string
  pfc?: PFC | null
  is_manual?: boolean
}): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      recipe_name: meal.recipe_name,
      category: meal.category,
      ingredients: meal.ingredients,
      pfc: meal.pfc ?? null,
      is_manual: meal.is_manual ?? false,
    })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id }
}

export async function updateMealPFC(mealId: number, pfc: PFC): Promise<void> {
  await supabase.from('meals').update({ pfc }).eq('id', mealId)
}

export async function getMeals(limit = 100): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('cooked_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    recipe_name: row.recipe_name,
    category: row.category,
    ingredients: row.ingredients,
    cooked_at: row.cooked_at,
    pfc: row.pfc as PFC | null,
    is_manual: row.is_manual,
  }))
}

// --- Favorites ---
export async function addFavorite(fav: {
  recipe_name: string
  recipe_data: string
}): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ recipe_name: fav.recipe_name, recipe_data: fav.recipe_data })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id }
}

export async function getFavorites(): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    recipe_name: row.recipe_name,
    recipe_data: row.recipe_data,
    created_at: row.created_at,
  }))
}

export async function removeFavorite(id: number): Promise<void> {
  await supabase.from('favorites').delete().eq('id', id)
}

// --- Shopping List ---
export async function getShoppingList(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
    checked: row.checked,
    recipe_name: row.recipe_name,
  }))
}

export async function addToShoppingList(ingredients: Ingredient[], recipeName?: string): Promise<void> {
  // Fetch existing unchecked items to merge duplicates
  const existing = await getShoppingList()
  const unchecked = existing.filter((i) => !i.checked)

  const toInsert: { name: string; amount: string; recipe_name?: string }[] = []

  for (const ing of ingredients) {
    const found = unchecked.find((item) => item.name === ing.name)
    if (found) {
      // Update amount if different
      if (ing.amount && found.amount && !found.amount.includes(ing.amount)) {
        await supabase
          .from('shopping_items')
          .update({ amount: `${found.amount} + ${ing.amount}` })
          .eq('id', found.id)
      }
    } else {
      toInsert.push({
        name: ing.name,
        amount: ing.amount,
        recipe_name: recipeName,
      })
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('shopping_items').insert(toInsert)
  }
}

export async function toggleShoppingItem(id: number): Promise<void> {
  const { data } = await supabase
    .from('shopping_items')
    .select('checked')
    .eq('id', id)
    .single()

  if (data) {
    await supabase.from('shopping_items').update({ checked: !data.checked }).eq('id', id)
  }
}

export async function removeShoppingItem(id: number): Promise<void> {
  await supabase.from('shopping_items').delete().eq('id', id)
}

export async function clearShoppingList(): Promise<void> {
  await supabase.from('shopping_items').delete().gt('id', 0)
}

// --- Pantry ---
export async function getPantry(): Promise<string[]> {
  const { data, error } = await supabase
    .from('pantry')
    .select('item_name')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => row.item_name)
}

export async function addToPantry(item: string): Promise<void> {
  await supabase.from('pantry').upsert(
    { item_name: item },
    { onConflict: 'user_id,item_name' }
  )
}

export async function removeFromPantry(item: string): Promise<void> {
  await supabase.from('pantry').delete().eq('item_name', item)
}

// --- PFC Goals ---
export async function getPFCGoals(): Promise<PFCGoals | null> {
  const { data, error } = await supabase
    .from('pfc_goals')
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    calories: data.calories,
    protein: data.protein,
    fat: data.fat,
    carbs: data.carbs,
  }
}

export async function savePFCGoals(goals: PFCGoals): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('pfc_goals').upsert({
    user_id: user.id,
    calories: goals.calories,
    protein: goals.protein,
    fat: goals.fat,
    carbs: goals.carbs,
  })
}

export async function removePFCGoals(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('pfc_goals').delete().eq('user_id', user.id)
}
