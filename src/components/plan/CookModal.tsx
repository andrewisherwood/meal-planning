"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { PlanRow } from "@/app/plan/page";

type CookModalProps = {
  meal: PlanRow | null;
  onClose: () => void;
};

export function CookModal({ meal, onClose }: CookModalProps) {
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
        </DrawerHeader>

        <div className="p-4 pb-8">
          {/* Loop 3.2 will add ingredients + steps here */}
          <p className="text-sm text-text-muted">
            Recipe details coming in Loop 3.2
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
