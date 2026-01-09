import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,title,slug,prep_minutes,cook_minutes,tags")
    .order("created_at", { ascending: false });

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-4">Recipes</h1>

      <div className="grid gap-3">
        {recipes?.map((r) => {
          const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/r/${r.slug}`}
              className="block p-4 border border-border rounded-xl hover:bg-surface-muted transition-colors"
            >
              <div className="text-lg font-semibold text-text-primary">{r.title}</div>
              <div className="text-text-secondary mt-1">
                {total ? `${total} min` : "—"}
                {r.tags?.length ? ` · ${r.tags.join(", ")}` : ""}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
