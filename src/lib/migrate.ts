import { supabase } from './supabase'

export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  // Skip if already migrated
  if (localStorage.getItem('nanimeshi-migrated')) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  let migrated = false

  // Migrate meals
  const mealsRaw = localStorage.getItem('nanimeshi-meals')
  if (mealsRaw) {
    try {
      const meals = JSON.parse(mealsRaw)
      if (meals.length > 0) {
        const rows = meals.map((m: any) => ({
          recipe_name: m.recipe_name,
          category: m.category,
          ingredients: m.ingredients,
          cooked_at: m.cooked_at,
          pfc: m.pfc ?? null,
          is_manual: m.is_manual ?? false,
        }))
        await supabase.from('meals').insert(rows)
        migrated = true
      }
    } catch { /* skip */ }
  }

  // Migrate favorites
  const favsRaw = localStorage.getItem('nanimeshi-favorites')
  if (favsRaw) {
    try {
      const favs = JSON.parse(favsRaw)
      if (favs.length > 0) {
        const rows = favs.map((f: any) => ({
          recipe_name: f.recipe_name,
          recipe_data: f.recipe_data,
          created_at: f.created_at,
        }))
        await supabase.from('favorites').insert(rows)
        migrated = true
      }
    } catch { /* skip */ }
  }

  // Migrate shopping list
  const shopRaw = localStorage.getItem('nanimeshi-shopping')
  if (shopRaw) {
    try {
      const items = JSON.parse(shopRaw)
      if (items.length > 0) {
        const rows = items.map((i: any) => ({
          name: i.name,
          amount: i.amount,
          checked: i.checked,
          recipe_name: i.recipe_name,
        }))
        await supabase.from('shopping_items').insert(rows)
        migrated = true
      }
    } catch { /* skip */ }
  }

  // Migrate pantry
  const pantryRaw = localStorage.getItem('nanimeshi-pantry')
  if (pantryRaw) {
    try {
      const items: string[] = JSON.parse(pantryRaw)
      if (items.length > 0) {
        const rows = items.map((name) => ({ item_name: name }))
        await supabase.from('pantry').insert(rows)
        migrated = true
      }
    } catch { /* skip */ }
  }

  // Migrate PFC goals
  const goalsRaw = localStorage.getItem('nanimeshi-pfc-goals')
  if (goalsRaw) {
    try {
      const goals = JSON.parse(goalsRaw)
      await supabase.from('pfc_goals').upsert({
        user_id: user.id,
        calories: goals.calories,
        protein: goals.protein,
        fat: goals.fat,
        carbs: goals.carbs,
      })
      migrated = true
    } catch { /* skip */ }
  }

  // Mark as migrated and clean up localStorage (keep API key)
  localStorage.setItem('nanimeshi-migrated', 'true')
  if (migrated) {
    localStorage.removeItem('nanimeshi-meals')
    localStorage.removeItem('nanimeshi-favorites')
    localStorage.removeItem('nanimeshi-shopping')
    localStorage.removeItem('nanimeshi-pantry')
    localStorage.removeItem('nanimeshi-pfc-goals')
  }

  return migrated
}
