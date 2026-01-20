"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MealSettingsProps = {
  householdId: string;
  initialDinnerTime: string;
  initialNotificationsEnabled: boolean;
  initialNotificationTime: string;
  initialNotificationSound: boolean;
};

export function MealSettings({
  householdId,
  initialDinnerTime,
  initialNotificationsEnabled,
  initialNotificationTime,
  initialNotificationSound,
}: MealSettingsProps) {
  const [dinnerTime, setDinnerTime] = useState(initialDinnerTime);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [notificationTime, setNotificationTime] = useState(initialNotificationTime);
  const [notificationSound, setNotificationSound] = useState(initialNotificationSound);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("households")
      .update({
        dinner_time: dinnerTime,
        notifications_enabled: notificationsEnabled,
        notification_time: notificationTime,
        notification_sound: notificationSound,
      })
      .eq("id", householdId);

    setSaving(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dinner Time */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Dinner time</p>
          <p className="text-xs text-text-muted">Used for calendar events</p>
        </div>
        <input
          type="time"
          value={dinnerTime}
          onChange={(e) => setDinnerTime(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Notifications Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Dinner reminders</p>
          <p className="text-xs text-text-muted">Get reminded to log your meal</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            notificationsEnabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notificationsEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Notification Time (only if enabled) */}
      {notificationsEnabled && (
        <div className="flex items-center justify-between pl-4 border-l-2 border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Reminder time</p>
            <p className="text-xs text-text-muted">When to send the reminder</p>
          </div>
          <input
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Sound Toggle (only if enabled) */}
      {notificationsEnabled && (
        <div className="flex items-center justify-between pl-4 border-l-2 border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Sound</p>
            <p className="text-xs text-text-muted">Play sound with reminder</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificationSound}
            onClick={() => setNotificationSound(!notificationSound)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              notificationSound ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationSound ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-text-primary text-surface hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
      </button>
    </div>
  );
}
