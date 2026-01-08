import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Recipe = {
  id: string;
  title: string;
  slug: string;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  notes: string | null;
};

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id,title,slug,servings,prep_minutes,cook_minutes,tags,notes")
    .eq("slug", slug)
    .maybeSingle();

  if (recipeError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Recipe</h1>
        <pre>DB error: {recipeError.message}</pre>
      </main>
    );
  }

  if (!recipe) notFound();

  const [{ data: ingredients, error: ingErr }, { data: steps, error: stepErr }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("id,line,optional")
        .eq("recipe_id", recipe.id)
        .order("id", { ascending: true }),
      supabase
        .from("recipe_steps")
        .select("id,step_no,text")
        .eq("recipe_id", recipe.id)
        .order("step_no", { ascending: true }),
    ]);

  if (ingErr || stepErr) {
    return (
      <main style={{ padding: 24 }}>
        <h1>{recipe.title}</h1>
        <pre>Ingredients error: {ingErr?.message ?? "none"}</pre>
        <pre>Steps error: {stepErr?.message ?? "none"}</pre>
      </main>
    );
  }

  const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <Link href="/" style={{ opacity: 0.8 }}>
        ← Back
      </Link>

      <h1 style={{ fontSize: 32, marginTop: 12 }}>{recipe.title}</h1>

      <div style={{ opacity: 0.8, marginTop: 6, marginBottom: 18 }}>
        {recipe.servings ? `Serves ${recipe.servings}` : ""}
        {total ? `${recipe.servings ? " · " : ""}${total} min` : ""}
        {recipe.tags?.length ? ` · ${recipe.tags.join(", ")}` : ""}
      </div>

      <h2 style={{ fontSize: 20, marginTop: 18 }}>Ingredients</h2>
      <ul>
        {ingredients?.map((i) => (
          <li key={i.id}>
            {i.line}
            {i.optional ? " (optional)" : ""}
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 18 }}>Steps</h2>
      <ol>
        {steps?.map((s) => (
          <li key={s.id} style={{ marginBottom: 8 }}>
            {s.text}
          </li>
        ))}
      </ol>
    </main>
  );
}
