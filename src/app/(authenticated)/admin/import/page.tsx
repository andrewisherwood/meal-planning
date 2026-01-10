import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";

type ImportIngredient = {
  line: string;
  name: string;
  qty?: number | null;
  unit?: string | null;
  optional?: boolean;
};

type ImportRecipe = {
  title: string;
  slug?: string;
  servings?: number | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  tags?: string[] | null;
  notes?: string | null;
  ingredients: ImportIngredient[];
  steps: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function asNumberOrNull(x: unknown): number | null {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

function validateRecipe(raw: any): ImportRecipe {
  if (!raw || typeof raw !== "object") throw new Error("JSON must be an object.");

  if (!isNonEmptyString(raw.title)) throw new Error("Missing/invalid: title");

  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
    throw new Error("Missing/invalid: ingredients[]");
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error("Missing/invalid: steps[]");
  }

  const ingredients: ImportIngredient[] = raw.ingredients.map((i: any, idx: number) => {
    if (!i || typeof i !== "object") throw new Error(`Ingredient #${idx + 1} must be an object.`);
    if (!isNonEmptyString(i.line)) throw new Error(`Ingredient #${idx + 1} missing: line`);
    if (!isNonEmptyString(i.name)) throw new Error(`Ingredient #${idx + 1} missing: name`);

    return {
      line: i.line.trim(),
      name: i.name.trim(),
      qty: asNumberOrNull(i.qty),
      unit: isNonEmptyString(i.unit) ? i.unit.trim() : null,
      optional: Boolean(i.optional),
    };
  });

  const steps: string[] = raw.steps.map((s: any, idx: number) => {
    if (!isNonEmptyString(s)) throw new Error(`Step #${idx + 1} must be a non-empty string.`);
    return s.trim();
  });

  const tags =
    Array.isArray(raw.tags) && raw.tags.every((t: any) => typeof t === "string")
      ? raw.tags.map((t: string) => t.trim()).filter(Boolean)
      : null;

  return {
    title: raw.title.trim(),
    slug: isNonEmptyString(raw.slug) ? raw.slug.trim() : undefined,
    servings: asNumberOrNull(raw.servings),
    prep_minutes: asNumberOrNull(raw.prep_minutes),
    cook_minutes: asNumberOrNull(raw.cook_minutes),
    tags,
    notes: isNonEmptyString(raw.notes) ? raw.notes.trim() : null,
    ingredients,
    steps,
  };
}

async function importRecipeAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const jsonText = String(formData.get("json") ?? "");

  if (!process.env.IMPORT_PASSWORD) throw new Error("Server missing IMPORT_PASSWORD.");
  if (password !== process.env.IMPORT_PASSWORD) throw new Error("Wrong password.");

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON (could not parse).");
  }

  const recipe = validateRecipe(parsed);
  const slug = recipe.slug ? slugify(recipe.slug) : slugify(recipe.title);

  // 1) Insert recipe
  const { data: inserted, error: recipeErr } = await supabaseAdmin
    .from("recipes")
    .insert({
      title: recipe.title,
      slug,
      servings: recipe.servings,
      prep_minutes: recipe.prep_minutes,
      cook_minutes: recipe.cook_minutes,
      tags: recipe.tags,
      notes: recipe.notes,
    })
    .select("id,slug")
    .single();

  if (recipeErr) {
    // Most common failure: duplicate slug
    throw new Error(`Recipe insert failed: ${recipeErr.message}`);
  }

  const recipeId = inserted.id as string;

  // 2) Insert ingredients
  const { error: ingErr } = await supabaseAdmin.from("recipe_ingredients").insert(
    recipe.ingredients.map((i) => ({
      recipe_id: recipeId,
      line: i.line,
      name: i.name,
      qty: i.qty ?? null,
      unit: i.unit ?? null,
      optional: i.optional ?? false,
    }))
  );

  if (ingErr) {
    // Rollback recipe to keep DB clean
    await supabaseAdmin.from("recipes").delete().eq("id", recipeId);
    throw new Error(`Ingredients insert failed: ${ingErr.message}`);
  }

  // 3) Insert steps
  const { error: stepErr } = await supabaseAdmin.from("recipe_steps").insert(
    recipe.steps.map((text, idx) => ({
      recipe_id: recipeId,
      step_no: idx + 1,
      text,
    }))
  );

  if (stepErr) {
    await supabaseAdmin.from("recipes").delete().eq("id", recipeId);
    throw new Error(`Steps insert failed: ${stepErr.message}`);
  }

  redirect(`/r/${inserted.slug}`);
}

export default function ImportPage() {
  const example = ``;

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <Link href="/recipes" style={{ opacity: 0.8 }}>
        ← Back to recipes
      </Link>

      <h1 style={{ fontSize: 28, marginTop: 12 }}>Import recipe JSON</h1>
      <p style={{ opacity: 0.85 }}>
        Paste JSON from ChatGPT. On success you’ll be redirected to the recipe page.
      </p>

      <form action={importRecipeAction} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #333",
              background: "transparent",
              color: "inherit",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Recipe JSON</span>
          <textarea
            name="json"
            defaultValue={example}
            rows={18}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #333",
              background: "transparent",
              color: "inherit",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #444",
            background: "#111",
            color: "inherit",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Import
        </button>
      </form>

      <div style={{ marginTop: 18, opacity: 0.8 }}>
        Tip: If you hit a “duplicate slug” error, add a unique suffix to the title or include a
        custom <code>slug</code>.
      </div>
    </main>
  );
}
