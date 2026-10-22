export type PushSupport = 'ready' | 'install' | 'blocked' | 'unsupported'

interface PushEnvironment {
  userAgent: string
  maxTouchPoints: number
  standalone: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  permission: NotificationPermission | null
}

const appleMobile = /iPad|iPhone|iPod/

export function isAppleMobile({ userAgent, maxTouchPoints }: PushEnvironment): boolean {
  return appleMobile.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1)
}

export function pushSupportOf(environment: PushEnvironment): PushSupport {
  if (isAppleMobile(environment) && !environment.standalone) {
    return 'install'
  }
  if (
    !environment.hasServiceWorker ||
    !environment.hasPushManager ||
    environment.permission === null
  ) {
    return 'unsupported'
  }
  return environment.permission === 'denied' ? 'blocked' : 'ready'
}

export function browserPushEnvironment(): PushEnvironment {
  const standaloneNavigator = 'standalone' in navigator && navigator.standalone === true
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone:
      standaloneNavigator ||
      ('matchMedia' in window && window.matchMedia('(display-mode: standalone)').matches),
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    permission: 'Notification' in window ? Notification.permission : null,
  }
}

export function applicationServerKey(base64: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export async function subscribeThisDevice(publicKey: string): Promise<PushSubscriptionJSON | null> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }
  const registration = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey),
    }))
  return subscription.toJSON()
}

export async function unsubscribeThisDevice(): Promise<string | null> {
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription === undefined || subscription === null) {
    return null
  }
  await subscription.unsubscribe()
  return subscription.endpoint
}
