import * as kv from './kv_store.tsx';

export async function sendFaithChallengePush(notification: any): Promise<void> {
  const recipientId = notification.recipientId;
  if (!recipientId) return;
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return;
  const [subscription, profile] = await Promise.all([
    kv.get(`push_subscription:${recipientId}`), kv.get(`user:${recipientId}`),
  ]);
  if (!subscription?.endpoint || profile?.notificationsEnabled === false || profile?.notificationSettings?.pushNotifications === false) return;
  const name = notification.data.senderName;
  const ready = notification.data.readyToReveal;
  const language = profile?.language;
  const title = language === 'am' ? '🎯 የዛሬው የጋራ ተግባር' : language === 'om' ? '🎯 Qormaata keessan kan har’aa' : notification.title;
  const body = language === 'am'
    ? (ready ? `${name} የዛሬውን ተግባር ሠርተዋል። መልሶቻችሁን አሁን ማየት ትችላላችሁ።` : `${name} የዛሬውን ተግባር ሠርተዋል፤ እርስዎን እየጠበቁ ነው።`)
    : language === 'om'
      ? (ready ? `${name} qormaata har’aa hojjetee jira. Kaardii keessan amma banuu dandeessu.` : `${name} qormaata har’aa hojjetee si eeggachaa jira.`)
      : notification.message;
  try {
    const webpush = await import('npm:web-push@3.6.7');
    webpush.setVapidDetails('mailto:support@twobeone.app', publicKey, privateKey);
    await webpush.sendNotification(subscription, JSON.stringify({
      title, body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png',
      tag: notification.id, data: notification.data, url: notification.data.url,
    }), { timeout: 5000, TTL: 86400 });
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) await kv.del(`push_subscription:${recipientId}`);
    // The database notification remains available when push is unsupported.
  }
}
