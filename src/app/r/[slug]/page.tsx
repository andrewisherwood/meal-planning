"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type Ingredient = { id: string; line: string; optional: boolean };
type Step = { id: string; step_no: number; text: string };

export default function RecipePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editServings, setEditServings] = useState<number | null>(null);
  const [editPrepMinutes, setEditPrepMinutes] = useState<number | null>(null);
  const [editCookMinutes, setEditCookMinutes] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editSteps, setEditSteps] = useState<string[]>([]);

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("id,title,slug,servings,prep_minutes,cook_minutes,tags,notes")
        .eq("slug", slug)
        .maybeSingle();

      if (recipeError) {
        setError(recipeError.message);
        setLoading(false);
        return;
      }

      if (!recipeData) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      setRecipe(recipeData);

      const [{ data: ing }, { data: stp }] = await Promise.all([
        supabase
          .from("recipe_ingredients")
          .select("id,line,optional")
          .eq("recipe_id", recipeData.id)
          .order("id", { ascending: true }),
        supabase
          .from("recipe_steps")
          .select("id,step_no,text")
          .eq("recipe_id", recipeData.id)
          .order("step_no", { ascending: true }),
      ]);

      setIngredients(ing ?? []);
      setSteps(stp ?? []);
      setLoading(false);
    };

    fetchRecipe();
  }, [slug]);

  // Initialize edit state when entering edit mode
  const enterEditMode = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditServings(recipe.servings);
    setEditPrepMinutes(recipe.prep_minutes);
    setEditCookMinutes(recipe.cook_minutes);
    setEditNotes(recipe.notes ?? "");
    setEditIngredients(ingredients.map((i) => i.line));
    setEditSteps(steps.map((s) => s.text));
    setIsEditing(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!recipe) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // Update recipe
      const { error: recipeErr } = await supabase
        .from("recipes")
        .update({
          title: editTitle,
          servings: editServings,
          prep_minutes: editPrepMinutes,
          cook_minutes: editCookMinutes,
          notes: editNotes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipe.id);

      if (recipeErr) throw recipeErr;

      // Update ingredients (delete all + insert new)
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);
      const newIngredients = editIngredients
        .filter((line) => line.trim())
        .map((line) => ({
          recipe_id: recipe.id,
          line: line.trim(),
          name: line.trim(),
          optional: false,
        }));
      if (newIngredients.length > 0) {
        await supabase.from("recipe_ingredients").insert(newIngredients);
      }

      // Update steps (delete all + insert new)
      await supabase.from("recipe_steps").delete().eq("recipe_id", recipe.id);
      const newSteps = editSteps
        .filter((text) => text.trim())
        .map((text, idx) => ({
          recipe_id: recipe.id,
          step_no: idx + 1,
          text: text.trim(),
        }));
      if (newSteps.length > 0) {
        await supabase.from("recipe_steps").insert(newSteps);
      }

      // Update local state
      setRecipe({
        ...recipe,
        title: editTitle,
        servings: editServings,
        prep_minutes: editPrepMinutes,
        cook_minutes: editCookMinutes,
        notes: editNotes.trim() || null,
      });
      setIngredients(
        newIngredients.map((i, idx) => ({ id: `new-${idx}`, line: i.line, optional: false }))
      );
      setSteps(newSteps.map((s, idx) => ({ id: `new-${idx}`, step_no: s.step_no, text: s.text })));

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  // Ingredient helpers
  const addIngredient = () => setEditIngredients([...editIngredients, ""]);
  const removeIngredient = (idx: number) =>
    setEditIngredients(editIngredients.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, value: string) =>
    setEditIngredients(editIngredients.map((v, i) => (i === idx ? value : v)));

  // Step helpers
  const addStep = () => setEditSteps([...editSteps, ""]);
  const removeStep = (idx: number) => setEditSteps(editSteps.filter((_, i) => i !== idx));
  const updateStep = (idx: number, value: string) =>
    setEditSteps(editSteps.map((v, i) => (i === idx ? value : v)));

  if (loading) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p className="text-text-secondary">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-text-primary mb-4">Recipe</h1>
        <pre className="text-sm text-destructive">DB error: {error}</pre>
      </main>
    );
  }

  if (notFoundState || !recipe) {
    notFound();
  }

  const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);

  return (
    <main className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/recipes" className="text-text-secondary hover:text-text-primary transition-colors">
        ← Back to recipes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mt-4 mb-6">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-3xl font-semibold text-text-primary w-full bg-transparent border-b-2 border-border focus:border-text-primary focus:outline-none"
              placeholder="Recipe title"
            />
          ) : (
            <h1 className="text-3xl font-semibold text-text-primary">{recipe.title}</h1>
          )}

          {/* Meta info */}
          {isEditing ? (
            <div className="flex flex-wrap gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                Servings:
                <input
                  type="number"
                  value={editServings ?? ""}
                  onChange={(e) => setEditServings(e.target.value ? Number(e.target.value) : null)}
                  className="w-16 px-2 py-1 rounded border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  min={1}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                Prep (min):
                <input
                  type="number"
                  value={editPrepMinutes ?? ""}
                  onChange={(e) => setEditPrepMinutes(e.target.value ? Number(e.target.value) : null)}
                  className="w-16 px-2 py-1 rounded border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  min={0}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                Cook (min):
                <input
                  type="number"
                  value={editCookMinutes ?? ""}
                  onChange={(e) => setEditCookMinutes(e.target.value ? Number(e.target.value) : null)}
                  className="w-16 px-2 py-1 rounded border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  min={0}
                />
              </label>
            </div>
          ) : (
            <p className="text-text-secondary mt-2">
              {recipe.servings ? `Serves ${recipe.servings}` : ""}
              {total ? `${recipe.servings ? " · " : ""}${total} min` : ""}
              {recipe.tags?.length ? ` · ${recipe.tags.join(", ")}` : ""}
            </p>
          )}
        </div>

        {/* Edit button */}
        {!isEditing && (
          <button
            type="button"
            onClick={enterEditMode}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            title="Edit recipe"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        )}
      </div>

      {/* Notes (edit mode) */}
      {isEditing && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Recipe Notes</h2>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Optional notes about this recipe..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </section>
      )}

      {/* Notes (view mode) */}
      {!isEditing && recipe.notes && (
        <section className="mb-6 bg-surface-muted rounded-lg p-4">
          <p className="text-sm text-text-secondary italic">{recipe.notes}</p>
        </section>
      )}

      {/* Ingredients */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Ingredients</h2>
        {isEditing ? (
          <div className="space-y-2">
            {editIngredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  placeholder="e.g., 200g flour"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="p-2 text-text-muted hover:text-destructive transition-colors"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              + Add ingredient
            </button>
          </div>
        ) : ingredients.length > 0 ? (
          <ul className="space-y-1.5">
            {ingredients.map((i) => (
              <li key={i.id} className="text-text-secondary">
                {i.line}
                {i.optional && <span className="text-text-muted ml-1">(optional)</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No ingredients listed</p>
        )}
      </section>

      {/* Steps */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Steps</h2>
        {isEditing ? (
          <div className="space-y-2">
            {editSteps.map((step, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slot-dinner-bg text-slot-dinner-border text-sm font-medium flex items-center justify-center mt-2">
                  {idx + 1}
                </span>
                <textarea
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  placeholder="Describe this step..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="p-2 text-text-muted hover:text-destructive transition-colors mt-1"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              + Add step
            </button>
          </div>
        ) : steps.length > 0 ? (
          <ol className="space-y-3">
            {steps.map((s, idx) => (
              <li key={s.id} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slot-dinner-bg text-slot-dinner-border text-sm font-medium flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-text-secondary pt-0.5">{s.text}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-text-muted">No steps listed</p>
        )}
      </section>

      {/* Save/Cancel buttons (edit mode) */}
      {isEditing && (
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </main>
  );
}
