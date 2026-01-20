import { createClient } from "@/lib/supabase/client";

// Category display order
export const CATEGORY_ORDER = [
  "Fresh produce",
  "Meat & fish",
  "Dairy & eggs",
  "Bakery",
  "Tinned & jarred",
  "Dry goods & pasta",
  "Frozen",
  "Condiments & sauces",
  "Spices & seasonings",
  "Baking",
  "Other",
] as const;

export type ShoppingItem = {
  id: string; // unique identifier for React key
  name: string; // normalized ingredient name
  displayLine: string; // aggregated or original line
  category: string; // from lookup or "Other"
  have: boolean; // from pantry table
  qty: number | null;
  unit: string | null;
};

export type ShoppingList = Record<string, ShoppingItem[]>;

type RawIngredient = {
  name: string;
  line: string;
  qty: number | null;
  unit: string | null;
};

/**
 * Generate a shopping list from meals in a date range
 */
export async function generateShoppingList(
  householdId: string,
  startDate: string,
  endDate: string
): Promise<ShoppingList> {
  const supabase = createClient();

  // 1. Get all recipe_ids from meal_plan for date range
  const { data: meals, error: mealsError } = await supabase
    .from("meal_plan")
    .select("recipe_id")
    .eq("household_id", householdId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (mealsError) {
    console.error("Error fetching meals:", mealsError);
    return {};
  }

  if (!meals || meals.length === 0) {
    return {};
  }

  // Get unique recipe IDs
  const recipeIds = [...new Set(meals.map((m) => m.recipe_id).filter(Boolean))];

  if (recipeIds.length === 0) {
    return {};
  }

  // 2. Get all ingredients for those recipes
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .select("name, line, qty, unit")
    .in("recipe_id", recipeIds);

  if (ingredientsError) {
    console.error("Error fetching ingredients:", ingredientsError);
    return {};
  }

  if (!ingredients || ingredients.length === 0) {
    return {};
  }

  // 3. Get category mappings
  const ingredientNames = [...new Set(ingredients.map((i) => i.name.toLowerCase()))];
  const { data: categories } = await supabase
    .from("ingredient_categories")
    .select("ingredient_name, category")
    .in("ingredient_name", ingredientNames);

  const categoryMap = new Map<string, string>();
  categories?.forEach((c) => {
    categoryMap.set(c.ingredient_name.toLowerCase(), c.category);
  });

  // 4. Get pantry state
  const { data: pantryItems } = await supabase
    .from("pantry")
    .select("ingredient_name, have")
    .eq("household_id", householdId)
    .in("ingredient_name", ingredientNames);

  const pantryMap = new Map<string, boolean>();
  pantryItems?.forEach((p) => {
    pantryMap.set(p.ingredient_name.toLowerCase(), p.have);
  });

  // 5. Aggregate ingredients
  const aggregated = aggregateIngredients(ingredients as RawIngredient[]);

  // 6. Build shopping list grouped by category
  const shoppingList: ShoppingList = {};

  for (const item of aggregated) {
    const nameLower = item.name.toLowerCase();
    const category = categoryMap.get(nameLower) || "Other";
    const have = pantryMap.get(nameLower) || false;

    const shoppingItem: ShoppingItem = {
      id: item.id,
      name: item.name,
      displayLine: item.displayLine,
      category,
      have,
      qty: item.qty,
      unit: item.unit,
    };

    if (!shoppingList[category]) {
      shoppingList[category] = [];
    }
    shoppingList[category].push(shoppingItem);
  }

  // Sort items within each category alphabetically
  for (const category of Object.keys(shoppingList)) {
    shoppingList[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  return shoppingList;
}

type AggregatedItem = {
  id: string; // unique identifier (name|unit combination)
  name: string;
  displayLine: string;
  qty: number | null;
  unit: string | null;
};

/**
 * Aggregate ingredients by name and unit
 * - Sum quantities when units match exactly
 * - List separately when units differ or are null
 */
function aggregateIngredients(ingredients: RawIngredient[]): AggregatedItem[] {
  // Group by name (case-insensitive) and unit
  const groups = new Map<string, RawIngredient[]>();

  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase()}|${ing.unit?.toLowerCase() ?? "null"}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(ing);
  }

  const results: AggregatedItem[] = [];

  for (const [key, items] of groups) {
    const first = items[0];
    const name = first.name;
    const unit = first.unit;
    // Use the grouping key as unique ID (name|unit)
    const id = key;

    // Check if all items have quantities we can sum
    const hasQuantities = items.every((i) => i.qty !== null);

    if (hasQuantities && items.length > 1) {
      // Sum quantities
      const totalQty = items.reduce((sum, i) => sum + (i.qty ?? 0), 0);
      const displayLine = formatDisplayLine(totalQty, unit, name);
      results.push({ id, name, displayLine, qty: totalQty, unit });
    } else if (items.length === 1) {
      // Single item - use original line
      results.push({ id, name, displayLine: first.line, qty: first.qty, unit });
    } else {
      // Multiple items but can't aggregate (mixed null qty)
      // Use first item's line as representative
      results.push({ id, name, displayLine: first.line, qty: first.qty, unit });
    }
  }

  return results;
}

/**
 * Format a display line from quantity, unit, and name
 */
function formatDisplayLine(qty: number, unit: string | null, name: string): string {
  if (unit === "item" || unit === null) {
    // "3 onions" or "onions"
    return qty > 0 ? `${qty} ${name}` : name;
  }
  // "125g butter"
  return `${qty}${unit} ${name}`;
}

/**
 * Update pantry state for an ingredient
 */
export async function updatePantryItem(
  householdId: string,
  ingredientName: string,
  have: boolean
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("pantry").upsert(
    {
      household_id: householdId,
      ingredient_name: ingredientName.toLowerCase(),
      have,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "household_id,ingredient_name",
    }
  );

  if (error) {
    console.error("Error updating pantry:", error);
  }
}

/**
 * Clear all pantry items for a household (reset "have" flags)
 */
export async function clearPantry(householdId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("pantry")
    .update({ have: false, updated_at: new Date().toISOString() })
    .eq("household_id", householdId);

  if (error) {
    console.error("Error clearing pantry:", error);
  }
}

/**
 * Format shopping list for export/clipboard
 */
export function formatShoppingListForExport(
  shoppingList: ShoppingList,
  startDate: string,
  endDate: string
): string {
  const formatDate = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const lines: string[] = [];
  lines.push(`Shopping List - ${formatDate(startDate)} to ${formatDate(endDate)}`);
  lines.push("");

  // Use category order, only include categories with unchecked items
  for (const category of CATEGORY_ORDER) {
    const items = shoppingList[category];
    if (!items || items.length === 0) continue;

    // Only include unchecked items
    const unchecked = items.filter((i) => !i.have);
    if (unchecked.length === 0) continue;

    lines.push(category.toUpperCase());
    for (const item of unchecked) {
      lines.push(`- ${item.displayLine}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Format shopping list for sharing (iOS Share Sheet, Notes, etc.)
 * Clean format with category headers and bullet points
 */
export function formatShoppingListForReminders(shoppingList: ShoppingList): string {
  const lines: string[] = [];

  for (const category of CATEGORY_ORDER) {
    const items = shoppingList[category];
    if (!items || items.length === 0) continue;

    const unchecked = items.filter((i) => !i.have);
    if (unchecked.length === 0) continue;

    if (lines.length > 0) {
      lines.push(""); // blank line between categories
    }
    lines.push(category);
    for (const item of unchecked) {
      lines.push(`- ${item.displayLine}`);
    }
  }

  return lines.join("\n");
}

/**
 * Get unchecked items as a flat array for export
 */
export function getUncheckedItems(shoppingList: ShoppingList): ShoppingItem[] {
  const items: ShoppingItem[] = [];
  for (const category of CATEGORY_ORDER) {
    const categoryItems = shoppingList[category];
    if (categoryItems) {
      items.push(...categoryItems.filter((i) => !i.have));
    }
  }
  return items;
}
