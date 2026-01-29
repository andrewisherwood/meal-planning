import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type SeedIngredient = {
  line: string;
  name: string;
  qty?: number | null;
  unit?: string | null;
  optional?: boolean;
};

type SeedRecipe = {
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  tags: string[];
  ingredients: SeedIngredient[];
  steps: string[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isoNow() {
  return new Date().toISOString();
}

async function upsertRecipe(r: SeedRecipe): Promise<string> {
  const slug = slugify(r.title);

  // Upsert by slug (shared recipes have household_id = NULL)
  const { data: recipe, error: recipeErr } = await supabase
    .from("recipes")
    .upsert(
      {
        slug,
        title: r.title,
        servings: r.servings,
        prep_minutes: r.prep_minutes,
        cook_minutes: r.cook_minutes,
        tags: r.tags,
        notes: null,
        household_id: null, // Shared recipe
        updated_at: isoNow(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (recipeErr) {
    console.error(`Failed to upsert recipe "${r.title}":`, recipeErr);
    throw recipeErr;
  }
  const recipeId = recipe.id as string;

  // Replace ingredients + steps (deterministic)
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);

  if (r.ingredients.length) {
    const { error: ingErr } = await supabase.from("recipe_ingredients").insert(
      r.ingredients.map((i) => ({
        recipe_id: recipeId,
        line: i.line,
        name: i.name,
        qty: i.qty ?? null,
        unit: i.unit ?? null,
        optional: i.optional ?? false,
      }))
    );
    if (ingErr) {
      console.error(`Failed to insert ingredients for "${r.title}":`, ingErr);
      throw ingErr;
    }
  }

  if (r.steps.length) {
    const { error: stepErr } = await supabase.from("recipe_steps").insert(
      r.steps.map((text, idx) => ({
        recipe_id: recipeId,
        step_no: idx + 1,
        text,
      }))
    );
    if (stepErr) {
      console.error(`Failed to insert steps for "${r.title}":`, stepErr);
      throw stepErr;
    }
  }

  return recipeId;
}

async function main() {
  // Read the JSON file
  const jsonPath = join(process.cwd(), "recipe-seed.json");
  const rawData = readFileSync(jsonPath, "utf-8");
  const recipes: SeedRecipe[] = JSON.parse(rawData);

  console.log(`Found ${recipes.length} recipes to import...`);

  let success = 0;
  let failed = 0;

  for (const recipe of recipes) {
    try {
      await upsertRecipe(recipe);
      success++;
      console.log(`  [${success}/${recipes.length}] ${recipe.title}`);
    } catch (e) {
      failed++;
      console.error(`  FAILED: ${recipe.title}`);
    }
  }

  console.log(`\nImport complete: ${success} succeeded, ${failed} failed`);
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
