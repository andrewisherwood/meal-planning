"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VoiceRecipeInput } from "@/components/VoiceRecipeInput";
import { createClient } from "@/lib/supabase/client";

type ParsedIngredient = {
  line: string;
  name: string;
  qty?: number | null;
  unit?: string | null;
};

type ParsedRecipe = {
  title: string;
  servings?: number | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  tags?: string[] | null;
  notes?: string | null;
  ingredients: ParsedIngredient[];
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

type TabId = "voice" | "paste";

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("voice");
  const [pasteText, setPasteText] = useState("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParseRecipe = async (text: string) => {
    setParsing(true);
    setError(null);
    setParsedRecipe(null);

    try {
      const response = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse recipe");
      }

      setParsedRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse recipe");
    } finally {
      setParsing(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pasteText.trim()) {
      handleParseRecipe(pasteText.trim());
    }
  };

  const handleSaveRecipe = async () => {
    if (!parsedRecipe) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const slug = slugify(parsedRecipe.title) + "-" + Date.now().toString(36);

      // 1) Insert recipe
      const { data: inserted, error: recipeErr } = await supabase
        .from("recipes")
        .insert({
          title: parsedRecipe.title,
          slug,
          servings: parsedRecipe.servings ?? null,
          prep_minutes: parsedRecipe.prep_minutes ?? null,
          cook_minutes: parsedRecipe.cook_minutes ?? null,
          tags: parsedRecipe.tags ?? null,
          notes: parsedRecipe.notes ?? null,
        })
        .select("id,slug")
        .single();

      if (recipeErr) throw new Error(`Recipe save failed: ${recipeErr.message}`);

      const recipeId = inserted.id as string;

      // 2) Insert ingredients
      if (parsedRecipe.ingredients.length > 0) {
        const { error: ingErr } = await supabase.from("recipe_ingredients").insert(
          parsedRecipe.ingredients.map((i) => ({
            recipe_id: recipeId,
            line: i.line,
            name: i.name,
            qty: i.qty ?? null,
            unit: i.unit ?? null,
            optional: false,
          }))
        );

        if (ingErr) {
          await supabase.from("recipes").delete().eq("id", recipeId);
          throw new Error(`Ingredients save failed: ${ingErr.message}`);
        }
      }

      // 3) Insert steps
      if (parsedRecipe.steps.length > 0) {
        const { error: stepErr } = await supabase.from("recipe_steps").insert(
          parsedRecipe.steps.map((text, idx) => ({
            recipe_id: recipeId,
            step_no: idx + 1,
            text,
          }))
        );

        if (stepErr) {
          await supabase.from("recipes").delete().eq("id", recipeId);
          throw new Error(`Steps save failed: ${stepErr.message}`);
        }
      }

      // Success - redirect to recipe page
      router.push(`/r/${inserted.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
      setSaving(false);
    }
  };

  const handleEditRecipe = (field: keyof ParsedRecipe, value: unknown) => {
    if (!parsedRecipe) return;
    setParsedRecipe({ ...parsedRecipe, [field]: value });
  };

  const handleClearParsed = () => {
    setParsedRecipe(null);
    setError(null);
  };

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link
        href="/recipes"
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        &larr; Back to recipes
      </Link>

      <h1 className="text-2xl font-semibold text-text-primary mt-4 mb-2">Add Recipe</h1>
      <p className="text-sm text-text-secondary mb-6">
        Speak or paste your recipe and AI will structure it for you.
      </p>

      {/* Show parsed recipe review or input tabs */}
      {parsedRecipe ? (
        <div className="space-y-6">
          {/* Recipe preview */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase">Title</label>
              <input
                type="text"
                value={parsedRecipe.title}
                onChange={(e) => handleEditRecipe("title", e.target.value)}
                className="w-full mt-1 px-3 py-2 text-lg font-medium rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted uppercase">Servings</label>
                <input
                  type="number"
                  value={parsedRecipe.servings ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("servings", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase">Prep (min)</label>
                <input
                  type="number"
                  value={parsedRecipe.prep_minutes ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("prep_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase">Cook (min)</label>
                <input
                  type="number"
                  value={parsedRecipe.cook_minutes ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("cook_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">Tags</label>
              <input
                type="text"
                value={parsedRecipe.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  handleEditRecipe(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="dinner, vegetarian, quick"
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">
                Ingredients ({parsedRecipe.ingredients.length})
              </label>
              <ul className="mt-1 space-y-1">
                {parsedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-sm text-text-primary">
                    {ing.line}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">
                Steps ({parsedRecipe.steps.length})
              </label>
              <ol className="mt-1 space-y-2 list-decimal list-inside">
                {parsedRecipe.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-text-primary">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {parsedRecipe.notes && (
              <div>
                <label className="text-xs text-text-muted uppercase">Notes</label>
                <p className="mt-1 text-sm text-text-secondary">{parsedRecipe.notes}</p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClearParsed}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={handleSaveRecipe}
              disabled={saving || !parsedRecipe.title}
              className="flex-1 px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save recipe"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("voice")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "voice"
                  ? "bg-text-primary text-surface"
                  : "bg-surface-muted text-text-secondary hover:text-text-primary"
              }`}
            >
              Voice
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "paste"
                  ? "bg-text-primary text-surface"
                  : "bg-surface-muted text-text-secondary hover:text-text-primary"
              }`}
            >
              Paste Text
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Parsing indicator */}
          {parsing && (
            <div className="p-6 rounded-xl border border-border bg-surface-muted text-center mb-4">
              <div className="animate-spin w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Parsing your recipe...</p>
            </div>
          )}

          {/* Tab content */}
          {!parsing && activeTab === "voice" && (
            <div className="p-6 rounded-xl border border-border bg-surface">
              <VoiceRecipeInput onTranscript={handleParseRecipe} disabled={parsing} />
            </div>
          )}

          {!parsing && activeTab === "paste" && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <label className="text-sm font-medium text-text-primary">
                  Paste recipe text
                </label>
                <p className="text-xs text-text-muted mt-1 mb-3">
                  Paste from a website, cookbook, or describe the recipe in your own words.
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g., Chicken stir fry with vegetables. Serves 4. Ingredients: 500g chicken breast, 2 bell peppers, soy sauce..."
                  rows={8}
                  maxLength={10000}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!pasteText.trim() || parsing}
                className="w-full px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Parse recipe
              </button>
            </form>
          )}

          {/* Tips */}
          <div className="mt-6 p-4 rounded-xl bg-surface-muted text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-2">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Include the recipe name</li>
              <li>List ingredients with quantities (e.g., &quot;200g chicken&quot;)</li>
              <li>Describe the cooking steps in order</li>
              <li>Mention prep/cook times if known</li>
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
