/**
 * Calendar export utilities for generating .ics files
 */

type MealEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  slot: string;
  recipeName: string;
};

type CalendarOptions = {
  dinnerTime?: string; // HH:MM format, default "18:00"
  durationMinutes?: number; // default 60
};

/**
 * Slot display names and default times
 */
const SLOT_CONFIG: Record<string, { label: string; defaultTime: string }> = {
  breakfast: { label: "Breakfast", defaultTime: "08:00" },
  lunch: { label: "Lunch", defaultTime: "12:00" },
  snack: { label: "Snack", defaultTime: "15:00" },
  "dinner:main": { label: "Dinner", defaultTime: "18:00" },
  "dinner:side": { label: "Dinner", defaultTime: "18:00" },
  "dinner:pudding": { label: "Dessert", defaultTime: "19:00" },
};

/**
 * Format date and time as iCal DTSTART/DTEND format
 * Format: YYYYMMDDTHHMMSS (local time, no timezone)
 */
function formatICalDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");
  return `${year}${month}${day}T${hour}${minute}00`;
}

/**
 * Add minutes to a time string
 */
function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + minutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  return `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
}

/**
 * Escape text for iCal format
 * Commas, semicolons, and backslashes need escaping
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a unique ID for an event
 */
function generateUID(mealId: string): string {
  return `${mealId}@suppertime.app`;
}

/**
 * Get the time for a slot, using dinner time override for dinner slots
 */
function getSlotTime(slot: string, dinnerTime: string): string {
  if (slot.startsWith("dinner:")) {
    // Use configured dinner time for main/side, +1hr for pudding
    if (slot === "dinner:pudding") {
      return addMinutes(dinnerTime, 60);
    }
    return dinnerTime;
  }
  return SLOT_CONFIG[slot]?.defaultTime || "18:00";
}

/**
 * Get display label for a slot
 */
function getSlotLabel(slot: string): string {
  return SLOT_CONFIG[slot]?.label || "Meal";
}

/**
 * Generate .ics file content from meal events
 */
export function generateICS(
  meals: MealEvent[],
  options: CalendarOptions = {}
): string {
  const { dinnerTime = "18:00", durationMinutes = 60 } = options;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Suppertime//Meal Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Meal Plan",
  ];

  // Generate timestamp for DTSTAMP (now in UTC)
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (const meal of meals) {
    const slotTime = getSlotTime(meal.slot, dinnerTime);
    const endTime = addMinutes(slotTime, durationMinutes);
    const slotLabel = getSlotLabel(meal.slot);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${generateUID(meal.id)}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatICalDateTime(meal.date, slotTime)}`);
    lines.push(`DTEND:${formatICalDateTime(meal.date, endTime)}`);
    lines.push(`SUMMARY:${escapeICalText(`${slotLabel}: ${meal.recipeName}`)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Share or download .ics file
 * Uses Web Share API on supported platforms, falls back to download
 */
export async function shareCalendar(
  icsContent: string,
  filename: string = "meal-plan.ics"
): Promise<{ shared: boolean; downloaded: boolean }> {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const file = new File([blob], filename, { type: "text/calendar" });

  // Try Web Share API first (iOS Safari, some Android browsers)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Meal Plan",
      });
      return { shared: true, downloaded: false };
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name === "AbortError") {
        return { shared: false, downloaded: false };
      }
      // Fall through to download
    }
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { shared: false, downloaded: true };
}

/**
 * Format date range for filename
 */
export function formatDateRangeForFilename(startDate: string, endDate: string): string {
  const formatDate = (ymd: string) => {
    const [, m, d] = ymd.split("-");
    return `${d}-${m}`;
  };
  return `meal-plan-${formatDate(startDate)}-to-${formatDate(endDate)}.ics`;
}
