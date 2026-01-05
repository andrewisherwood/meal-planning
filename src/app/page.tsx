import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RecipeRow = {
  id: string;
  title: string;
  slug: string;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
};

export default async function HomePage() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id,title,slug,prep_minutes,cook_minutes,tags")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Recipes</h1>
        <pre>DB error: {error.message}</pre>
      </main>
    );
  }

  const recipes = (data ?? []) as RecipeRow[];

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Recipes</h1>

      {recipes.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {recipes.map((r) => {
            const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
            return (
              <li key={r.id} style={{ border: "1px solid #333", borderRadius: 12, padding: 14 }}>
                <Link href={`/r/${r.slug}`} style={{ fontSize: 18, textDecoration: "none" }}>
                  {r.title}
                </Link>
                <div style={{ marginTop: 6, opacity: 0.8 }}>
                  {total ? <span>{total} min</span> : <span>—</span>}
                  {r.tags?.length ? <span> · {r.tags.join(", ")}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
