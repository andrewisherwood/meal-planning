"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";
import type { PlanRow } from "@/app/plan/page";

type Ingredient = { id: string; line: string; optional: boolean };
type Step = { id: string; step_no: number; text: string };

type CookModalProps = {
  meal: PlanRow | null;
  onClose: () => void;
};

export function CookModal({ meal, onClose }: CookModalProps) {
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
    <Drawer
      open={true}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      dismissible={false}
    >
      <DrawerContent>
        <DrawerHeader className="relative">
          <DrawerClose
            onClick={onClose}
            className="absolute right-4 top-4 text-text-secondary hover:text-text-primary"
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
          </DrawerClose>
          <DrawerTitle>{meal.recipes?.title ?? "Recipe"}</DrawerTitle>
          {meal.recipes?.tags?.length ? (
            <p className="text-sm text-text-secondary mt-1">
              {meal.recipes.tags.join(", ")}
            </p>
          ) : null}
        </DrawerHeader>

        <div className="p-4 pb-8 space-y-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : (
            <>
              {/* Ingredients */}
              <section>
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Ingredients
                </h3>
                {ingredients.length > 0 ? (
                  <ul className="space-y-1">
                    {ingredients.map((ing) => (
                      <li
                        key={ing.id}
                        className="text-sm text-text-secondary"
                      >
                        {ing.line}
                        {ing.optional && (
                          <span className="text-text-muted"> (optional)</span>
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
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Steps
                </h3>
                {steps.length > 0 ? (
                  <ol className="space-y-3 list-decimal list-inside">
                    {steps.map((step) => (
                      <li
                        key={step.id}
                        className="text-sm text-text-secondary"
                      >
                        {step.text}
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
      </DrawerContent>
    </Drawer>
  );
}
