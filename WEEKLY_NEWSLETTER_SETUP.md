# TwoBeOne Shabbat Shalom Weekly Email

The newsletter sends one email each Saturday at 09:00 Africa/Addis_Ababa (06:00 UTC) to registered users and confirmed standalone subscribers.

## Delivery secrets

Create a separate Resend API key with **Sending access**. Do not reuse or expose the key created by the Supabase Auth integration.

Configure these Supabase Edge Function secrets:

- `RESEND_API_KEY`: the Resend sending-access API key
- `NEWSLETTER_FROM_EMAIL`: `TwoBeOne <newsletter@twobeone.app>`
- `NEWSLETTER_CRON_SECRET`: a random value of at least 32 bytes

## Cron Vault values

`supabase/config.toml` maps the project URL and `NEWSLETTER_CRON_SECRET` into Supabase Vault. Push the configuration and migration with the same environment value used for the Edge secret.

```bash
NEWSLETTER_CRON_SECRET=your-secret supabase db push --linked
```

Apply `supabase/migrations/20260817204500_schedule_weekly_newsletter.sql` to create the Saturday job.

## Safety behavior

- New subscribers must confirm by email.
- Registered account emails and active standalone subscribers receive campaigns.
- Unsubscribed addresses are suppressed even if the associated account remains registered.
- Account-derived addresses stop receiving if the account is deleted.
- Every email has a visible unsubscribe link and RFC 8058 one-click unsubscribe headers.
- Campaigns are keyed by ISO week and completed batches are recorded to prevent duplicate sends during retries.
- Subscriber addresses are visible only to authenticated TwoBeOne administrators.
- Resend batches contain at most 100 personalized messages.
