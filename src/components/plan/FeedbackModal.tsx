"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  mealPlanId: string;
  mealName: string;
  date: string;
  recipeId?: string;
  onLeftoversAdded?: () => void; // Callback to refresh plan data
};

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function FeedbackModal({
  open,
  onClose,
  mealPlanId,
  mealName,
  date,
  recipeId,
  onLeftoversAdded,
}: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [saveLeftovers, setSaveLeftovers] = useState(false);

  const triggerConfetti = () => {
    // Fire confetti from both sides
    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 1,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.2, y: 0.6 },
      angle: 60,
    });

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.8, y: 0.6 },
      angle: 120,
    });

    // Second burst after slight delay
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        origin: { x: 0.5, y: 0.7 },
        angle: 90,
      });
    }, 150);
  };

  const handleComplete = async () => {
    setSubmitting(true);

    // Trigger confetti immediately for responsiveness
    triggerConfetti();

    const supabase = createClient();

    // Record completion
    await supabase.from("meal_completions").upsert(
      {
        meal_plan_id: mealPlanId,
        completed: true,
        skipped: false,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "meal_plan_id",
      }
    );

    // Add leftovers to tomorrow's lunch if checkbox is checked
    if (saveLeftovers && recipeId) {
      // Get household_id from the meal_plan entry
      const { data: mealData } = await supabase
        .from("meal_plan")
        .select("household_id")
        .eq("id", mealPlanId)
        .single();

      if (mealData?.household_id) {
        // Calculate tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowYmd = tomorrow.toISOString().slice(0, 10);

        // Get next position for lunch slot
        const { data: existing } = await supabase
          .from("meal_plan")
          .select("pos")
          .eq("household_id", mealData.household_id)
          .eq("date", tomorrowYmd)
          .eq("meal", "lunch");

        const maxPos = existing?.length ? Math.max(...existing.map((r) => r.pos)) : 0;

        // Insert leftover entry
        await supabase.from("meal_plan").insert({
          household_id: mealData.household_id,
          date: tomorrowYmd,
          meal: "lunch",
          pos: maxPos + 1,
          recipe_id: recipeId,
          notes: "Leftovers",
        });

        onLeftoversAdded?.();
      }
    }

    // Auto-close after confetti settles
    setTimeout(() => {
      setSubmitting(false);
      setSaveLeftovers(false);
      onClose();
    }, 1500);
  };

  const handleSkip = async () => {
    setSubmitting(true);

    // Record skip (no confetti)
    const supabase = createClient();
    await supabase.from("meal_completions").upsert(
      {
        meal_plan_id: mealPlanId,
        completed: false,
        skipped: true,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "meal_plan_id",
      }
    );

    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white rounded-3xl p-0 max-w-sm w-[90vw] overflow-hidden shadow-2xl border-0">
        <DialogHeader className="p-6 pb-4 text-center">
          <DialogTitle className="text-2xl font-semibold text-text-primary">
            How was dinner?
          </DialogTitle>
          <p className="text-sm text-text-secondary mt-2">
            {formatDate(date)}
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Meal name */}
          <div className="text-center py-4">
            <p className="text-lg font-medium text-text-primary">{mealName}</p>
          </div>

          {/* Leftovers checkbox */}
          {recipeId && (
            <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted cursor-pointer hover:bg-surface transition-colors">
              <input
                type="checkbox"
                checked={saveLeftovers}
                onChange={(e) => setSaveLeftovers(e.target.checked)}
                className="w-5 h-5 rounded border-border text-green-500 focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm text-text-primary">
                Save leftovers for tomorrow&apos;s lunch
              </span>
            </label>
          )}

          {/* Everyone Ate button */}
          <button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-green-500 text-white font-semibold text-lg hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Everyone Ate!
          </button>

          {/* Skip option */}
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            Not tonight
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
