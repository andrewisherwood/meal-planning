"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "@/lib/push";

type NotificationSettingsProps = {
  userId: string;
  householdId: string;
};

export function NotificationSettings({
  userId,
  householdId,
}: NotificationSettingsProps) {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentCard, setShowConsentCard] = useState(false);

  // Check support and current subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!isPushSupported()) {
        setSupported(false);
        setLoading(false);
        return;
      }

      setPermission(getNotificationPermission());

      const supabase = createClient();

      // Check if user has previously consented to notifications
      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_consent_at, notification_consent_withdrawn_at")
        .eq("id", userId)
        .single();

      const consentGiven = profile?.notification_consent_at &&
        (!profile.notification_consent_withdrawn_at ||
          new Date(profile.notification_consent_at) > new Date(profile.notification_consent_withdrawn_at));
      setHasConsented(!!consentGiven);

      // Check if we have an active subscription
      const subscription = await getCurrentSubscription();
      if (subscription) {
        // Verify it's in our database
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("endpoint", subscription.endpoint)
          .single();

        setSubscribed(!!data);
      }

      setLoading(false);
    };

    checkStatus();
  }, [userId]);

  const handleConsentAndSubscribe = async () => {
    setSubscribing(true);
    setError(null);

    try {
      const supabase = createClient();

      // First, record consent in the database
      if (!hasConsented) {
        const { error: consentError } = await supabase
          .from("profiles")
          .update({
            notification_consent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (consentError) {
          throw new Error("Failed to save consent");
        }
        setHasConsented(true);
      }

      // Now request browser permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Permission denied. Please enable notifications in your browser settings.");
        setSubscribing(false);
        setShowConsentCard(false);
        return;
      }

      // Subscribe to push
      const { endpoint, p256dh, auth } = await subscribeToPush();

      // Save subscription to database
      const { error: dbError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          household_id: householdId,
          endpoint,
          p256dh,
          auth,
        },
        {
          onConflict: "user_id,endpoint",
        }
      );

      if (dbError) {
        throw new Error(dbError.message);
      }

      setSubscribed(true);
      setShowConsentCard(false);
    } catch (err) {
      console.error("Failed to subscribe:", err);
      setError(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setSubscribing(false);
    }
  };

  const handleShowConsentCard = () => {
    setShowConsentCard(true);
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);
    setError(null);

    try {
      // Get current subscription to find endpoint
      const subscription = await getCurrentSubscription();

      if (subscription) {
        // Remove from browser
        await unsubscribeFromPush();

        // Remove from database
        const supabase = createClient();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", subscription.endpoint);
      }

      setSubscribed(false);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      setError(err instanceof Error ? err.message : "Failed to disable notifications");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-text-secondary">
        Checking notification status...
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="text-sm text-text-muted">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  // Show consent card if user clicks enable without prior consent
  if (showConsentCard) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <h4 className="text-sm font-medium text-amber-900 mb-2">
            Notification Consent
          </h4>
          <p className="text-xs text-amber-800 mb-3">
            Suppertime would like to send you push notifications for dinner reminders
            (e.g., &quot;Did everyone eat?&quot;). We&apos;ll only notify you about reminders you&apos;ve
            scheduled.
          </p>
          <p className="text-xs text-amber-700 mb-4">
            You can disable notifications at any time from this settings page. See our{" "}
            <Link href="/privacy" target="_blank" className="underline">
              Privacy Policy
            </Link>{" "}
            for details on how we handle your data.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConsentAndSubscribe}
              disabled={subscribing}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {subscribing ? "Enabling..." : "Yes, enable notifications"}
            </button>
            <button
              type="button"
              onClick={() => setShowConsentCard(false)}
              disabled={subscribing}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">
            Push notifications on this device
          </p>
          <p className="text-xs text-text-muted">
            {subscribed
              ? "You'll receive dinner reminders here"
              : "Get reminded on this device"}
          </p>
        </div>
        {subscribed ? (
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={subscribing}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            {subscribing ? "..." : "Disable"}
          </button>
        ) : hasConsented ? (
          <button
            type="button"
            onClick={handleConsentAndSubscribe}
            disabled={subscribing}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {subscribing ? "Enabling..." : "Enable"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleShowConsentCard}
            disabled={subscribing}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            Enable
          </button>
        )}
      </div>

      {permission === "denied" && (
        <p className="text-xs text-amber-600">
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {subscribed && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Notifications enabled
        </div>
      )}
    </div>
  );
}
