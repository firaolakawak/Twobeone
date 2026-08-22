interface SendNotificationParams {
  recipientId: string;
  type: 'devotional' | 'journal' | 'prayer' | 'question' | 'partner_link' | 'general';
  title: string;
  message: string;
  data?: any;
  accessToken: string;
  projectId: string;
}

export async function sendNotification({
  recipientId,
  type,
  title,
  message,
  data,
  accessToken,
  projectId
}: SendNotificationParams): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          type,
          title,
          message,
          data
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to send notification:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}