self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : {
        title: "Alert",
        body: "New Notification",
      };

  const options = {
    body: data.body,
    icon: "/logo.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click event on mobile
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If website is open, focus it, otherwise open a new tab
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      }),
  );
});
