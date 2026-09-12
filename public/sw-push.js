// ── Push Event Handler for Service Worker ──────────────────────────────────
// This file is imported into the Workbox-generated SW via importScripts.
// It handles Web Push events to show notifications even when the phone is locked.

self.addEventListener("push", (event) => {
  console.log("[SW Push] Push event received");

  const fallback = {
    title: "💈 Novo Cliente na Fila!",
    body: "Um novo cliente está aguardando atendimento.",
    tag: "novo-cliente-push",
    url: "/admin/atendimento",
  };

  let data = { ...fallback };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.title || fallback.title,
        body: parsed.body || fallback.body,
        tag: parsed.tag || fallback.tag,
        url: parsed.url || fallback.url,
      };
    } catch (e) {
      try {
        const text = event.data.text();
        if (text) data.body = text;
      } catch (e2) {
        // keep fallback
      }
    }
  }

  const options = {
    body: data.body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag,
    vibrate: [500, 200, 500, 200, 500],
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url,
      timestamp: Date.now(),
    },
    actions: [{ action: "open", title: "Ver Fila" }],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification Click Handler ─────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  console.log("[SW Push] Notification clicked");
  event.notification.close();

  const urlPath = event.notification.data?.url || "/admin/atendimento";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlPath);
    }),
  );
});
