export interface NewsletterSubscriber {
  email: string;
  status: 'pending' | 'active' | 'unsubscribed';
  source: string;
  subscribedAt?: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  confirmationSentAt?: string;
  unsubscribeToken?: string;
  registeredUserId?: string;
}

export interface RegisteredEmail {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  confirmedAt?: string;
}

export interface NewsletterAudience {
  recipients: NewsletterSubscriber[];
  recordsToPersist: NewsletterSubscriber[];
}

/**
 * Combines explicit newsletter subscriptions with registered accounts.
 * An unsubscribe record always wins, and account-derived records are only
 * retained while the corresponding registered account still exists.
 */
export function buildNewsletterAudience(
  subscribers: NewsletterSubscriber[],
  registeredUsers: RegisteredEmail[],
): NewsletterAudience {
  const storedByEmail = new Map(subscribers.map(subscriber => [subscriber.email, subscriber]));
  const recipients = new Map<string, NewsletterSubscriber>();
  const recordsToPersist: NewsletterSubscriber[] = [];

  for (const subscriber of subscribers) {
    if (subscriber.status === 'active' && subscriber.source !== 'registered_user') {
      recipients.set(subscriber.email, subscriber);
    }
  }

  for (const user of registeredUsers) {
    const existing = storedByEmail.get(user.email);
    if (existing?.status === 'unsubscribed') continue;

    if (existing?.status === 'active') {
      recipients.set(user.email, existing);
      continue;
    }

    const accountSubscriber: NewsletterSubscriber = {
      ...existing,
      email: user.email,
      status: 'active',
      source: 'registered_user',
      subscribedAt: existing?.subscribedAt || user.createdAt || new Date().toISOString(),
      confirmedAt: existing?.confirmedAt || user.confirmedAt,
      registeredUserId: user.id,
    };
    recipients.set(user.email, accountSubscriber);
    recordsToPersist.push(accountSubscriber);
  }

  return { recipients: [...recipients.values()], recordsToPersist };
}
