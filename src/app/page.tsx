import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,title,slug,prep_minutes,cook_minutes,tags")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Recipes</h1>

        <Link
          href="/admin/import"
          title="Import recipe"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "1px solid #444",
            textDecoration: "none",
            color: "inherit",
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          +
        </Link>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {recipes?.map((r) => {
          const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/r/${r.slug}`}
              style={{
                display: "block",
                padding: 16,
                border: "1px solid #333",
                borderRadius: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600 }}>{r.title}</div>
              <div style={{ opacity: 0.8, marginTop: 6 }}>
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
