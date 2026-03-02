// ── Push Event Handler for Service Worker ──────────────────────────────────
// This file is imported into the Workbox-generated SW via importScripts.
// It handles Web Push events to show notifications even when the phone is locked.

self.addEventListener("push", (event) => {
  console.log("[SW Push] Push event received");

  // Default notification (since we send TTL-only pushes without encrypted payload)
  const title = "💈 Novo Cliente na Fila!";
  const options = {
    body: "Um novo cliente está aguardando atendimento.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "novo-cliente-push",
    vibrate: [500, 200, 500, 200, 500],
    renotify: true,
    requireInteraction: true,
    data: {
      url: "/admin",
      timestamp: Date.now(),
    },
    actions: [
      {
        action: "open",
        title: "Ver Fila",
      },
    ],
  };

  // Try to parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) options.body = data.body || options.body;
      event.waitUntil(self.registration.showNotification(data.title || title, options));
      return;
    } catch (e) {
      // Try as text
      try {
        const text = event.data.text();
        if (text) options.body = text;
      } catch (e2) {
        // Use defaults
      }
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ─────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  console.log("[SW Push] Notification clicked");
  event.notification.close();

  const urlPath = event.notification.data?.url || "/admin";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(urlPath);
    }),
  );
});
