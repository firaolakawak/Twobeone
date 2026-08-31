# TwoBeOne

TwoBeOne is a free, faith-centered relationship app designed for Christian couples. It gives two partners a private shared space to strengthen their relationship with each other and with God.

Its main features include:

- Daily Scripture-based devotionals and reflection prompts
- Shared prayer requests and answered-prayer tracking
- Private and shared couple journaling
- More than 1,000 conversation questions across faith, family, finance, intimacy, trust, and everyday life
- Partner chat, shared calendar, reminders, and relationship milestones
- Mood tracking, weekly reports, and AI-generated relationship insights
- Pre-marriage lessons, quizzes, and marriage-readiness reports
- Scripture memorization and Bible reading
- Christian community groups
- Progress, engagement, and devotional-streak tracking

Each person creates an account, then connects with their partner using a unique invitation code. Couple-related content is synchronized between the two accounts.

The app supports English, Amharic, and Afaan Oromo, making it particularly relevant to Ethiopian Christian communities. It is intended for dating, engaged, newlywed, and married couples.

Technically, the primary product is a React and TypeScript Progressive Web App built with Vite. It uses Supabase for authentication, database storage, server functions, partner synchronization, and authorization. It also includes offline support, install-to-home-screen functionality, push notifications, an administration console, newsletters, and AI-assisted analysis.

One important repository observation: it contains both the main Vite PWA and an Expo/React Native starter structure. The Vite application under [`src/app/App.tsx`](src/app/App.tsx) appears to be the developed product, while parts of the root Expo setup do not accurately describe the full app yet. The project is feature-rich, but the documentation and duplicate platform structure would benefit from consolidation before production handoff.
