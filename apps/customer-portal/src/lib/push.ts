/**
 * Web Push subscription helpers.
 *
 * Flow:
 * 1. Fetch VAPID public key from /comms/web-push/vapid-key
 * 2. Request notification permission from the browser
 * 3. Call PushManager.subscribe() with the VAPID key
 * 4. POST the subscription to /comms/web-push/subscribe
 *
 * The server (comms-service WebPushService) stores the subscription
 * and uses it to deliver filter-reminder / announcement push messages.
 */

import api from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await api.get<{ publicKey: string }>('/comms/web-push/vapid-key');
  return res.data.publicKey;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!(await isPushSupported())) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
  });

  const json = sub.toJSON();
  await api.post('/comms/web-push/subscribe', {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  });

  return sub;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!(await isPushSupported())) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await api.delete('/comms/web-push/subscribe', { data: { endpoint: sub.endpoint } });
  await sub.unsubscribe();
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!(await isPushSupported())) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}
