export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushSubscriptionDto {
  id: string;
  endpoint: string;
}

/** JSON payload delivered through the browser's push service and read by the service worker. */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}
