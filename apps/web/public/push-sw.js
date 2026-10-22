self.addEventListener('push', (event) => {
  const message = event.data ? event.data.json() : {}
  const title = typeof message.title === 'string' ? message.title : 'MyCogniAI'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof message.body === 'string' ? message.body : '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'practice-reminder',
      data: { url: typeof message.url === 'string' ? message.url : '/zen' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data.url, self.location.origin)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === target.origin)
      if (open) {
        return open.navigate(target.href).then((client) => (client ? client.focus() : undefined))
      }
      return self.clients.openWindow(target.href)
    }),
  )
})
