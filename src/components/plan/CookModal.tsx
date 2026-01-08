"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { PlanRow } from "@/app/plan/page";

type Ingredient = { id: string; line: string; optional: boolean };
type Step = { id: string; step_no: number; text: string };

type CookModalProps = {
  meal: PlanRow | null;
  onClose: () => void;
  onDelete: () => void;
};

function formatDate(ymd: string) {
  const date = new Date(ymd + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function CookModal({ meal, onClose, onDelete }: CookModalProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);

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
              <DialogTitle className="text-2xl font-semibold text-text-primary leading-tight">
                {meal.recipes?.title ?? "Recipe"}
              </DialogTitle>

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

              {/* Tags */}
              {meal.recipes?.tags?.length ? (
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
              {/* Edit icon (placeholder for future) */}
              <button
                type="button"
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                title="Edit recipe (coming soon)"
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

              {/* Close icon */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                title="Close"
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
          ) : (
            <>
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
                  <h3 className="text-base font-semibold text-text-primary">
                    Ingredients
                  </h3>
                </div>
                {ingredients.length > 0 ? (
                  <ul className="space-y-2 pl-1">
                    {ingredients.map((ing) => (
                      <li
                        key={ing.id}
                        className="text-sm text-text-secondary leading-relaxed"
                      >
                        {ing.line}
                        {ing.optional && (
                          <span className="text-text-muted ml-1">(optional)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">No ingredients listed</p>
                )}
              </section>

              {/* Steps */}
              <section>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Steps
                </h3>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
