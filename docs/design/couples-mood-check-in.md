# Couples mood check-in

The Couples Dashboard uses a daily dialog with the existing rose/blush palette and Inter/Tayitu typography. Mood entry appears in this popup; the dashboard heading displays the partner's current mood emoji.

- The automatic dialog appears on the dashboard only after a successful mood load confirms that the signed-in person has no mood from the last 24 hours. Both accounts must be linked.
- Each account is prompted at most once per 24 hours in the same browser/app installation, including after a dismissal or reload. A guarded localStorage timestamp provides persistence; memory is used when browser storage is blocked.
- Selecting a mood saves it through the existing authenticated moods API. The dialog stays open with a retry message if saving fails. **Not now** dismisses it without creating a mood.
- Each person's newest valid mood expires 24 hours after its saved timestamp. This rolling window is independent of time zones and calendar midnight.
- The heading puts the signed-in person first and shows only their partner's current emoji: **Firaol & Keti 🙂** on Firaol's phone; **Keti & Firaol 😄** on Keti's phone. The emoji is omitted when the partner has no current mood. Its accessible label identifies the partner and their mood.
- Moods refresh on dashboard entry, visible focus/resume, and the existing five-minute poll. Expiration has its own timer. Failed reads do not establish that a mood is missing, and stale account responses cannot populate another account's dashboard.

Great → 😄 · Good → 🙂 · Okay → 😐 · Sad → 😔. These labels and the dialog copy support English, Amharic, and Afaan Oromo.
