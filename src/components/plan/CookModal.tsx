"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { PlanRow } from "@/app/(authenticated)/plan/page";
import { FeedbackModal } from "./FeedbackModal";

type Ingredient = { id: string; line: string; optional: boolean };
type Step = { id: string; step_no: number; text: string };

type CookModalProps = {
  meal: PlanRow | null;
  onClose: () => void;
  onDelete: () => void;
  onUpdate?: () => void; // Called after saving to refresh parent data
};

function formatDate(ymd: string) {
  const date = new Date(ymd + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function CookModal({ meal, onClose, onDelete, onUpdate }: CookModalProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!meal?.recipe_id) {
      setIngredients([]);
      setSteps([]);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: ing }, { data: stp }] = await Promise.all([
        supabase
          .from("recipe_ingredients")
          .select("id,line,optional")
          .eq("recipe_id", meal.recipe_id)
          .order("id", { ascending: true }),
        supabase
          .from("recipe_steps")
          .select("id,step_no,text")
          .eq("recipe_id", meal.recipe_id)
          .order("step_no", { ascending: true }),
      ]);
      setIngredients(ing ?? []);
      setSteps(stp ?? []);
      setLoading(false);
    };

    fetchDetails();
  }, [meal?.recipe_id]);

  // Reset edit state when modal closes or meal changes
  useEffect(() => {
    setIsEditing(false);
    setShowFeedback(false);
  }, [meal?.id]);

  // Initialize edit state when entering edit mode
  const enterEditMode = () => {
    setEditTitle(meal?.recipes?.title ?? "");
    setEditIngredients(ingredients.map((i) => i.line));
    setEditSteps(steps.map((s) => s.text));
    setEditNotes(meal?.notes ?? "");
    setSaveError(null);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
  };

  // Save changes
  const handleSave = async () => {
    if (!meal?.recipe_id) return;

    setSaving(true);
    setSaveError(null);
    const supabase = createClient();

    try {
      // Update recipe title
      if (editTitle !== meal.recipes?.title) {
        const { error } = await supabase
          .from("recipes")
          .update({ title: editTitle, updated_at: new Date().toISOString() })
          .eq("id", meal.recipe_id);
        if (error) throw new Error(`Failed to save title: ${error.message}`);
      }

      // Update ingredients (delete all + insert new)
      const { error: delIngErr } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", meal.recipe_id);
      if (delIngErr) throw new Error(`Failed to update ingredients: ${delIngErr.message}`);

      const newIngredients = editIngredients
        .filter((line) => line.trim())
        .map((line) => ({
          recipe_id: meal.recipe_id,
          line: line.trim(),
          name: line.trim(),
          optional: false,
        }));
      if (newIngredients.length > 0) {
        const { error: insIngErr } = await supabase.from("recipe_ingredients").insert(newIngredients);
        if (insIngErr) throw new Error(`Failed to save ingredients: ${insIngErr.message}`);
      }

      // Update steps (delete all + insert new)
      const { error: delStepErr } = await supabase
        .from("recipe_steps")
        .delete()
        .eq("recipe_id", meal.recipe_id);
      if (delStepErr) throw new Error(`Failed to update steps: ${delStepErr.message}`);

      const newSteps = editSteps
        .filter((text) => text.trim())
        .map((text, idx) => ({
          recipe_id: meal.recipe_id,
          step_no: idx + 1,
          text: text.trim(),
        }));
      if (newSteps.length > 0) {
        const { error: insStepErr } = await supabase.from("recipe_steps").insert(newSteps);
        if (insStepErr) throw new Error(`Failed to save steps: ${insStepErr.message}`);
      }

      // Update meal notes
      const { error: notesErr } = await supabase
        .from("meal_plan")
        .update({ notes: editNotes.trim() || null })
        .eq("id", meal.id);
      if (notesErr) throw new Error(`Failed to save notes: ${notesErr.message}`);

      // Refresh local state
      setIngredients(
        newIngredients.map((i, idx) => ({ id: `new-${idx}`, line: i.line, optional: false }))
      );
      setSteps(newSteps.map((s, idx) => ({ id: `new-${idx}`, step_no: s.step_no, text: s.text })));

      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save changes");
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

  if (!meal) return null;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="bg-white rounded-3xl p-0 max-w-lg w-[90vw] max-h-[85vh] overflow-hidden shadow-2xl border-0"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-semibold text-text-primary leading-tight w-full bg-transparent border-b-2 border-border focus:border-text-primary focus:outline-none"
                  placeholder="Recipe title"
                />
              ) : (
                <DialogTitle className="text-2xl font-semibold text-text-primary leading-tight">
                  {meal.recipes?.title ?? "Recipe"}
                </DialogTitle>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDate(meal.date)}
              </div>

              {/* Tags (view mode only) */}
              {!isEditing && meal.recipes?.tags?.length ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {meal.recipes.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-slot-dinner-bg text-slot-dinner-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1">
              {!isEditing && (
                <>
                  {/* Edit icon */}
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

                  {/* Delete icon */}
                  <button
                    type="button"
                    onClick={onDelete}
                    className="p-2 rounded-lg text-text-muted hover:text-destructive hover:bg-error-bg transition-colors cursor-pointer"
                    title="Remove from plan"
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </>
              )}

              {/* Close icon */}
              <button
                type="button"
                onClick={isEditing ? cancelEdit : onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                title={isEditing ? "Cancel" : "Close"}
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 pt-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-sm text-text-muted py-4 text-center">Loading...</p>
          ) : isEditing ? (
            /* Edit Mode */
            <>
              {/* Ingredients */}
              <section>
                <h3 className="text-base font-semibold text-text-primary mb-3">Ingredients</h3>
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
              </section>

              {/* Steps */}
              <section>
                <h3 className="text-base font-semibold text-text-primary mb-3">Steps</h3>
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
              </section>

              {/* Meal Notes */}
              <section>
                <h3 className="text-base font-semibold text-text-primary mb-3">Notes for this meal</h3>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g., Double portion, skip the onions..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </section>

              {/* Error message */}
              {saveError && (
                <div className="px-3 py-2 rounded-lg bg-error-bg border border-error-border text-sm text-error">
                  {saveError}
                </div>
              )}

              {/* Save/Cancel buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-border text-text-secondary font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* View Mode */
            <>
              {/* Meal notes (if any) */}
              {meal.notes && (
                <section className="bg-surface-muted rounded-lg p-3">
                  <p className="text-sm text-text-secondary italic">{meal.notes}</p>
                </section>
              )}

              {/* Ingredients */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-secondary"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <h3 className="text-base font-semibold text-text-primary">Ingredients</h3>
                </div>
                {ingredients.length > 0 ? (
                  <ul className="space-y-2 pl-1">
                    {ingredients.map((ing) => (
                      <li key={ing.id} className="text-sm text-text-secondary leading-relaxed">
                        {ing.line}
                        {ing.optional && <span className="text-text-muted ml-1">(optional)</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">No ingredients listed</p>
                )}
              </section>

              {/* Steps */}
              <section>
                <h3 className="text-base font-semibold text-text-primary mb-3">Steps</h3>
                {steps.length > 0 ? (
                  <ol className="space-y-4">
                    {steps.map((step, index) => (
                      <li key={step.id} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slot-dinner-bg text-slot-dinner-border text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-text-secondary leading-relaxed pt-0.5">
                          {step.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-text-muted">No steps listed</p>
                )}
              </section>

              {/* Done cooking button */}
              <section className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors cursor-pointer"
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Done cooking?
                </button>
              </section>
            </>
          )}
        </div>
      </DialogContent>

      {/* Feedback modal */}
      {meal && (
        <FeedbackModal
          open={showFeedback}
          onClose={() => {
            setShowFeedback(false);
            onClose(); // Close the cook modal too
          }}
          mealPlanId={meal.id}
          mealName={meal.recipes?.title ?? "This meal"}
          date={meal.date}
        />
      )}
    </Dialog>
  );
}
