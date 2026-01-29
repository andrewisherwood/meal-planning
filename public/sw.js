// Service Worker for Suppertime Push Notifications

// Listen for push events from the server
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch {
    // If not JSON, treat as text
    data = {
      title: "Suppertime",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || "Time to log your dinner!",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: "dinner-reminder",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/plan?feedback=true",
      date: data.date,
      mealPlanId: data.mealPlanId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Suppertime", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/plan?feedback=true";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window we can focus
      for (const client of clientList) {
        if (client.url.includes("/plan") && "focus" in client) {
          // Navigate existing window to feedback
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  // Activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});
