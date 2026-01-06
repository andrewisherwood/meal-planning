import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type SeedRecipe = {
  slug: string;
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  tags: string[];
  notes?: string | null;
  ingredients: Array<{ line: string; name: string; qty?: number | null; unit?: string | null; optional?: boolean }>;
  steps: string[];
};

const household = {
  slug: "isherwood",
  name: "The Isherwoods",
  dietary_preferences: ["nut-free"], // tweak freely
};

const SLOT = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinnerMain: "dinner:main",
  dinnerSide: "dinner:side",
  dinnerPudding: "dinner:pudding",
} as const;

function isoNow() {
  return new Date().toISOString();
}

// Choose the week start you want to seed (Monday is nice).
// This uses local timezone via Date; you can hardcode "YYYY-MM-DD" if you prefer.
function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(start: Date, days: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d;
}

async function upsertHousehold(): Promise<string> {
  const { data, error } = await supabase
    .from("households")
    .upsert(
      {
        slug: household.slug,
        name: household.name,
        dietary_preferences: household.dietary_preferences,
        updated_at: isoNow(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function replaceMembers(householdId: string) {
  await supabase.from("household_members").delete().eq("household_id", householdId);

  const { error } = await supabase.from("household_members").insert([
    { household_id: householdId, name: "Andy", role: "parent" },
    { household_id: householdId, name: "Lily", role: "parent" },
    { household_id: householdId, name: "Flora", role: "child" },
    { household_id: householdId, name: "Bea", role: "child" },
  ]);

  if (error) throw error;
}

async function upsertRecipe(householdId: string, r: SeedRecipe): Promise<string> {
  // Upsert by slug (stable)
  const { data: recipe, error: recipeErr } = await supabase
    .from("recipes")
    .upsert(
      {
        slug: r.slug,
        title: r.title,
        servings: r.servings,
        prep_minutes: r.prep_minutes,
        cook_minutes: r.cook_minutes,
        tags: r.tags,
        notes: r.notes ?? null,
        household_id: householdId,
        updated_at: isoNow(),
      },
      { onConflict: "slug" } // assumes recipes.slug is unique globally (your schema shows that)
    )
    .select("id")
    .single();

  if (recipeErr) throw recipeErr;
  const recipeId = recipe.id as string;

  // Deterministic seed: replace ingredients + steps
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
    if (ingErr) throw ingErr;
  }

  if (r.steps.length) {
    const { error: stepErr } = await supabase.from("recipe_steps").insert(
      r.steps.map((text, idx) => ({
        recipe_id: recipeId,
        step_no: idx + 1,
        text,
      }))
    );
    if (stepErr) throw stepErr;
  }

  return recipeId;
}

async function upsertPlanItem(args: {
  householdId: string;
  date: string;
  slot: string;
  pos: number;
  recipeId: string;
  notes?: string | null;
}) {
  const { error } = await supabase.from("meal_plan").upsert(
    {
      household_id: args.householdId,
      date: args.date,
      meal: args.slot, // slot key
      pos: args.pos,   // position in that slot
      recipe_id: args.recipeId,
      notes: args.notes ?? null,
    },
    { onConflict: "household_id,date,meal,pos" }
  );

  if (error) throw error;
}

/**
 * Recipes to seed
 * - mains tagged: ["main"]
 * - sides tagged: ["side"]
 * - puddings tagged: ["pudding"]
 * - breakfasts tagged: ["breakfast"]
 * - leftovers lunch tagged: ["leftovers","lunch"]
 *
 * You said you already have 3 dinners. This script won’t break them:
 * - It only upserts by slug for the recipes listed here.
 * - So just avoid using the same slugs as your existing dinners.
 */
const recipesToSeed: SeedRecipe[] = [
  // ---------- Breakfasts ----------
  {
    slug: "breakfast-overnight-oats",
    title: "Overnight oats (no drama)",
    servings: 2,
    prep_minutes: 5,
    cook_minutes: 0,
    tags: ["breakfast", "baseline"],
    notes: "Make once, eat twice. Add fruit if you’ve got it.",
    ingredients: [
      { line: "Rolled oats", name: "Rolled oats", qty: 80, unit: "g" },
      { line: "Milk (or alt)", name: "Milk", qty: 250, unit: "ml" },
      { line: "Yoghurt", name: "Yoghurt", qty: 100, unit: "g", optional: true },
      { line: "Honey", name: "Honey", qty: 1, unit: "tbsp", optional: true },
      { line: "Fruit", name: "Fruit (berries/banana)", optional: true },
    ],
    steps: ["Mix everything in a jar/bowl.", "Fridge overnight.", "Stir, eat, done."],
  },
  {
    slug: "breakfast-eggs-toast-fruit",
    title: "Eggs + toast + fruit",
    servings: 2,
    prep_minutes: 10,
    cook_minutes: 5,
    tags: ["breakfast", "baseline"],
    notes: "Works even on tired mornings.",
    ingredients: [
      { line: "Eggs", name: "Eggs", qty: 4, unit: "pcs" },
      { line: "Bread", name: "Bread", qty: 4, unit: "slices" },
      { line: "Fruit", name: "Fruit (whatever exists)", optional: true },
    ],
    steps: ["Cook eggs how you like.", "Toast bread.", "Serve with fruit if available."],
  },

  // ---------- Mains ----------
  {
    slug: "dinner-pasta-cheese",
    title: "Pasta & cheese",
    servings: 4,
    prep_minutes: 5,
    cook_minutes: 12,
    tags: ["main", "baseline", "vegetarian"],
    notes: "Baseline is allowed. Add peas if you have energy.",
    ingredients: [
      { line: "Pasta", name: "Pasta", qty: 400, unit: "g" },
      { line: "Cheddar", name: "Cheddar", qty: 150, unit: "g" },
      { line: "Butter", name: "Butter", qty: 30, unit: "g", optional: true },
      { line: "Peas", name: "Frozen peas", qty: 150, unit: "g", optional: true },
    ],
    steps: [
      "Boil pasta (add peas for the last 2 minutes if using).",
      "Drain, add cheese (and butter if using).",
      "Stir. Serve. No guilt.",
    ],
  },
  {
    slug: "dinner-onepot-chilli",
    title: "One-pot chilli (double batch)",
    servings: 6,
    prep_minutes: 10,
    cook_minutes: 30,
    tags: ["main", "one-pot", "freezer-friendly"],
    notes: "Cook once, lunch tomorrow.",
    ingredients: [
      { line: "Mince (or lentils)", name: "Mince (or lentils)", qty: 500, unit: "g" },
      { line: "Onion", name: "Onion", qty: 1, unit: "pcs" },
      { line: "Tinned tomatoes", name: "Tinned tomatoes", qty: 2, unit: "cans" },
      { line: "Beans", name: "Kidney beans", qty: 2, unit: "cans" },
      { line: "Spices", name: "Chilli + cumin + paprika", optional: true },
    ],
    steps: [
      "Brown mince (or start lentils).",
      "Add onion, then tomatoes + beans + spices.",
      "Simmer 20–25 mins. Taste, salt, done.",
    ],
  },
  {
    slug: "dinner-salmon-rice-cucumber",
    title: "Salmon + rice + cucumber",
    servings: 4,
    prep_minutes: 10,
    cook_minutes: 15,
    tags: ["main", "quick"],
    notes: "Feels like ‘proper dinner’ without being hard.",
    ingredients: [
      { line: "Salmon", name: "Salmon fillets", qty: 4, unit: "pcs" },
      { line: "Rice", name: "Rice", qty: 300, unit: "g" },
      { line: "Cucumber", name: "Cucumber", qty: 1, unit: "pcs", optional: true },
      { line: "Soy", name: "Soy sauce", optional: true },
      { line: "Lemon", name: "Lemon", optional: true },
    ],
    steps: ["Cook rice.", "Pan-fry or oven-bake salmon.", "Serve with cucumber + soy/lemon if you want."],
  },

  // ---------- Sides ----------
  {
    slug: "side-green-salad",
    title: "Green salad (2-minute)",
    servings: 4,
    prep_minutes: 2,
    cook_minutes: 0,
    tags: ["side", "baseline"],
    notes: "Bagged salad counts.",
    ingredients: [
      { line: "Salad", name: "Mixed leaves", qty: 1, unit: "bag" },
      { line: "Oil", name: "Olive oil", optional: true },
      { line: "Vinegar", name: "Vinegar/lemon", optional: true },
    ],
    steps: ["Put in bowl. Dress if you want."],
  },
  {
    slug: "side-garlic-bread",
    title: "Garlic bread",
    servings: 4,
    prep_minutes: 5,
    cook_minutes: 10,
    tags: ["side"],
    notes: "Because sometimes joy matters.",
    ingredients: [
      { line: "Bread", name: "Baguette", qty: 1, unit: "pcs" },
      { line: "Butter", name: "Butter", qty: 60, unit: "g" },
      { line: "Garlic", name: "Garlic", qty: 2, unit: "cloves", optional: true },
      { line: "Parsley", name: "Parsley", optional: true },
    ],
    steps: ["Mix butter + garlic.", "Spread, bake 8–10 mins."],
  },

  // ---------- Puddings ----------
  {
    slug: "pudding-yoghurt-fruit",
    title: "Yoghurt + fruit",
    servings: 4,
    prep_minutes: 2,
    cook_minutes: 0,
    tags: ["pudding", "baseline"],
    notes: "Low effort, still feels like a finish.",
    ingredients: [
      { line: "Yoghurt", name: "Yoghurt", qty: 400, unit: "g" },
      { line: "Fruit", name: "Fruit", optional: true },
      { line: "Honey", name: "Honey", optional: true },
    ],
    steps: ["Spoon yoghurt. Add fruit/honey if you want."],
  },
  {
    slug: "pudding-choc-mousse-cheat",
    title: "Chocolate mousse (easy)",
    servings: 4,
    prep_minutes: 10,
    cook_minutes: 0,
    tags: ["pudding"],
    notes: "Use when you’ve got a bit more energy.",
    ingredients: [
      { line: "Dark chocolate", name: "Dark chocolate", qty: 150, unit: "g" },
      { line: "Eggs", name: "Eggs", qty: 3, unit: "pcs" },
    ],
    steps: [
      "Melt chocolate and cool slightly.",
      "Separate eggs. Whisk whites to soft peaks.",
      "Mix yolks into chocolate, then fold whites in.",
      "Chill if you can. Eat if you can’t wait.",
    ],
  },

  // ---------- Leftover lunches ----------
  {
    slug: "lunch-leftover-chilli",
    title: "Leftover chilli",
    servings: 1,
    prep_minutes: 2,
    cook_minutes: 3,
    tags: ["lunch", "leftovers", "baseline"],
    notes: "Already cooked beats cooking again.",
    ingredients: [{ line: "Chilli", name: "Leftover chilli", optional: true }],
    steps: ["Reheat. Eat. Move on."],
  },
];

async function main() {
  const householdId = await upsertHousehold();
  await replaceMembers(householdId);

  // Seed recipes
  const idBySlug: Record<string, string> = {};
  for (const r of recipesToSeed) {
    const id = await upsertRecipe(householdId, r);
    idBySlug[r.slug] = id;
  }

  // Seed a realistic week plan (starting today; adjust if you prefer Monday)
  const start = new Date();
  const days = Array.from({ length: 7 }, (_, i) => ymd(addDays(start, i)));

  // Example structure:
  // - breakfasts: oats / eggs alternating
  // - lunches: leftover chilli on day 2
  // - dinners: main + 1–2 sides + pudding (some days)
  for (let i = 0; i < 7; i++) {
    const date = days[i];

    // Breakfast
    const breakfastSlug = i % 2 === 0 ? "breakfast-overnight-oats" : "breakfast-eggs-toast-fruit";
    await upsertPlanItem({ householdId, date, slot: SLOT.breakfast, pos: 1, recipeId: idBySlug[breakfastSlug] });

    // Lunch (only seed explicit leftovers a couple of times)
    if (i === 2 || i === 5) {
      await upsertPlanItem({
        householdId,
        date,
        slot: SLOT.lunch,
        pos: 1,
        recipeId: idBySlug["lunch-leftover-chilli"],
        notes: "Leftovers for the cook first.",
      });
    }

    // Dinner main rotation
    const dinnerMainSlug =
      i % 3 === 0 ? "dinner-onepot-chilli" : i % 3 === 1 ? "dinner-salmon-rice-cucumber" : "dinner-pasta-cheese";

    await upsertPlanItem({
      householdId,
      date,
      slot: SLOT.dinnerMain,
      pos: 1,
      recipeId: idBySlug[dinnerMainSlug],
    });

    // Dinner sides (1–2 sides depending on day)
    await upsertPlanItem({
      householdId,
      date,
      slot: SLOT.dinnerSide,
      pos: 1,
      recipeId: idBySlug["side-green-salad"],
    });

    if (dinnerMainSlug !== "dinner-pasta-cheese" && i % 2 === 0) {
      await upsertPlanItem({
        householdId,
        date,
        slot: SLOT.dinnerSide,
        pos: 2,
        recipeId: idBySlug["side-garlic-bread"],
      });
    }

    // Pudding (some days only)
    if (i === 1 || i === 4 || i === 6) {
      const pudSlug = i === 4 ? "pudding-choc-mousse-cheat" : "pudding-yoghurt-fruit";
      await upsertPlanItem({
        householdId,
        date,
        slot: SLOT.dinnerPudding,
        pos: 1,
        recipeId: idBySlug[pudSlug],
      });
    }
  }

  console.log("✅ Seed complete", { householdId, seededRecipes: recipesToSeed.length, seededDays: 7 });
}

main().catch((e) => {
  console.error("❌ Seed failed", e);
  process.exit(1);
});
