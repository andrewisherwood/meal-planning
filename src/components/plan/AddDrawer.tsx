"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { SLOT_LABEL } from "@/app/plan/page";

type AddDrawerProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  slot: string;
};

function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function AddDrawer({ open, onClose, date, slot }: AddDrawerProps) {
  const slotLabel = SLOT_LABEL[slot] ?? slot;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent>
        <DrawerHeader className="relative">
          <DrawerClose className="absolute right-4 top-4 text-text-secondary hover:text-text-primary">
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
          <DrawerTitle>Add to {slotLabel}</DrawerTitle>
          <DrawerDescription>{formatDate(date)}</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 pb-8">
          {/* Loop 2.2 will add search here */}
          <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-text-muted">
            Recipe search coming in Loop 2.2
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
