"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register the service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);

        // Check for updates periodically
        registration.update();
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
