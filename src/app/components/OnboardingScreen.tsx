import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  BookOpen,
  Check,
  Heart,
  Languages,
  LockKeyhole,
  MessageCircleHeart,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import type { Language } from "../utils/i18n";

type AuthDestination = "signin" | "signup";

interface OnboardingScreenProps {
  onComplete: (destination: AuthDestination) => void;
}

const COPY = {
  en: {
    skip: "Skip",
    back: "Back",
    next: "Continue",
    step: "Step",
    welcomeTitle: "Grow together in faith and love",
    welcomeBody:
      "A private space for you and your partner to build a Christ-centered relationship, one meaningful moment at a time.",
    habitsTitle: "Small habits. A stronger bond.",
    habitsBody:
      "Make room for what matters with simple activities designed for busy couples.",
    connectTitle: "Two hearts, one shared journey",
    connectBody:
      "Invite your partner with a private code. Your prayers, reflections, and progress stay in sync wherever you are.",
    privateTitle: "Made for both of you",
    privateBody:
      "Choose your language and start your journey. Your personal relationship space remains private.",
    create: "Create an account",
    signIn: "I already have an account",
    language: "Choose your language",
    privateLabel: "Private couple space",
    syncLabel: "Synced across your devices",
    features: ["Daily devotionals", "Prayer together", "Meaningful questions"],
  },
  am: {
    skip: "ዝለል",
    back: "ተመለስ",
    next: "ቀጥል",
    step: "ደረጃ",
    welcomeTitle: "በእምነትና በፍቅር አብራችሁ እደጉ",
    welcomeBody: "ከክርስቶስ ጋር ያማከለ ግንኙነት ለመገንባት ለእርስዎና ለባልደረባዎ የተዘጋጀ የግል ቦታ።",
    habitsTitle: "ትናንሽ ልማዶች፣ ጠንካራ ግንኙነት",
    habitsBody: "ለጥንዶች በተዘጋጁ ቀላል እንቅስቃሴዎች አስፈላጊ ለሆኑ ነገሮች ጊዜ ይስጡ።",
    connectTitle: "ሁለት ልቦች፣ አንድ የጋራ ጉዞ",
    connectBody: "ባልደረባዎን በግል ኮድ ይጋብዙ። ጸሎቶቻችሁ፣ ማስታወሻዎቻችሁ እና እድገታችሁ ይመሳሰላሉ።",
    privateTitle: "ለሁለታችሁም የተዘጋጀ",
    privateBody: "ቋንቋዎን ይምረጡና ጉዞዎን ይጀምሩ። የግንኙነት ቦታዎ የግል ሆኖ ይቆያል።",
    create: "መለያ ፍጠር",
    signIn: "መለያ አለኝ",
    language: "ቋንቋዎን ይምረጡ",
    privateLabel: "የግል የጥንዶች ቦታ",
    syncLabel: "በመሳሪያዎችዎ ላይ የተመሳሰለ",
    features: ["ዕለታዊ ትምህርት", "የጋራ ጸሎት", "ትርጉም ያላቸው ጥያቄዎች"],
  },
  om: {
    skip: "Darbi",
    back: "Duubatti",
    next: "Itti fufi",
    step: "Tarkaanfii",
    welcomeTitle: "Amantii fi jaalalaan waliin guddadhaa",
    welcomeBody: "Hariiroo Kiristoosiin giddu-galeessa godhate ijaaruuf bakka dhuunfaa isinii fi hiriyaa keessaniif qophaa'e.",
    habitsTitle: "Amala xixiqqaa, hariiroo cimaa",
    habitsBody: "Gochaalee salphaa hiriyootaaf qophaa'aniin wantoota barbaachisoo ta'aniif yeroo kennaa.",
    connectTitle: "Onnee lama, imala tokko",
    connectBody: "Koodii dhuunfaatiin hiriyaa keessan affeeraa. Kadhannaan, yaadannoo fi guddinni keessan wal-sima.",
    privateTitle: "Isin lamaaniif kan qophaa'e",
    privateBody: "Afaan keessan filadhaatii imala keessan jalqabaa. Bakki hariiroo keessanii dhuunfaa ta'ee tura.",
    create: "Akkaawuntii bani",
    signIn: "Akkaawuntii qaba",
    language: "Afaan keessan filadhaa",
    privateLabel: "Bakka dhuunfaa hiriyootaa",
    syncLabel: "Meeshaalee keessan irratti wal-sima",
    features: ["Barnoota guyyaa", "Kadhannaa waliin", "Gaaffilee hiika qaban"],
  },
} as const;

const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; shortLabel: string }> = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "am", label: "አማርኛ", shortLabel: "አማ" },
  { code: "om", label: "Afaan Oromo", shortLabel: "OM" },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState(0);
  const copy = COPY[language];
  const totalSteps = 4;

  useEffect(() => {
    const initialUrl = new URL(window.location.href);
    initialUrl.hash = "onboarding-1";
    window.history.replaceState({ twobeoneOnboardingStep: 0 }, "", initialUrl);
  }, []);

  const goToStep = (nextStep: number) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = `onboarding-${nextStep + 1}`;
    // Replace instead of push so an Android WebView does not accumulate four
    // fake pages that the hardware Back button must traverse after sign-in.
    window.history.replaceState({ twobeoneOnboardingStep: nextStep }, "", nextUrl);
    setStep(nextStep);
  };

  const finish = (destination: AuthDestination) => {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = "";
    window.history.replaceState({}, "", cleanUrl);
    onComplete(destination);
  };

  const handleSkip = () => finish("signup");

  return (
    <main
      className="relative isolate flex min-h-screen min-h-[100dvh] flex-col overflow-hidden bg-white text-slate-950"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl" />

      <header className="relative z-10 flex min-h-12 items-center justify-between px-5">
        <div className="flex items-center gap-2" aria-label="TwoBeOne">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-200">
            <Heart className="h-5 w-5 fill-white text-white" aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-tight">TwoBeOne</span>
        </div>
        {step < totalSteps - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-11 rounded-full px-4 text-sm font-bold text-slate-500 transition-colors active:bg-slate-100"
          >
            {copy.skip}
          </button>
        )}
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${language}-${step}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <OnboardingPage
                artwork={<WelcomeArtwork />}
                eyebrow="TwoBeOne"
                title={copy.welcomeTitle}
                body={copy.welcomeBody}
              />
            )}

            {step === 1 && (
              <OnboardingPage
                artwork={<HabitsArtwork />}
                eyebrow={`${copy.step} 2`}
                title={copy.habitsTitle}
                body={copy.habitsBody}
              >
                <div className="mt-5 grid gap-2.5">
                  {[BookOpen, Heart, MessageCircleHeart].map((Icon, index) => (
                    <div key={copy.features[index]} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold text-slate-700">{copy.features[index]}</span>
                      <Check className="ml-auto h-4 w-4 text-emerald-500" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </OnboardingPage>
            )}

            {step === 2 && (
              <OnboardingPage
                artwork={<ConnectArtwork />}
                eyebrow={`${copy.step} 3`}
                title={copy.connectTitle}
                body={copy.connectBody}
              >
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoPill icon={LockKeyhole} label={copy.privateLabel} />
                  <InfoPill icon={Sparkles} label={copy.syncLabel} />
                </div>
              </OnboardingPage>
            )}

            {step === 3 && (
              <OnboardingPage
                compact
                artwork={<PrivacyArtwork />}
                eyebrow={`${copy.step} 4`}
                title={copy.privateTitle}
                body={copy.privateBody}
              >
                <div className="mt-5">
                  <p className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <Languages className="h-4 w-4" aria-hidden="true" />
                    {copy.language}
                  </p>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={copy.language}>
                    {LANGUAGE_OPTIONS.map((option) => {
                      const selected = language === option.code;
                      return (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          key={option.code}
                          onClick={() => setLanguage(option.code)}
                          className={`min-h-14 rounded-2xl border px-2 py-2 text-center transition-all ${
                            selected
                              ? "border-rose-500 bg-rose-50 text-rose-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
                          }`}
                        >
                          <span className="block text-sm font-extrabold">{option.shortLabel}</span>
                          <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-75">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </OnboardingPage>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-md px-5 pt-4">
        <div className="mb-5 flex justify-center gap-2" aria-label={`${step + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all duration-200 ${index === step ? "w-7 bg-rose-500" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>

        {step < totalSteps - 1 ? (
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="grid min-h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-[0.98]"
                aria-label={copy.back}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 text-base font-extrabold text-white shadow-lg shadow-rose-200 transition-transform active:scale-[0.98]"
            >
              {copy.next}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            <button
              type="button"
              onClick={() => finish("signup")}
              className="min-h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 text-base font-extrabold text-white shadow-lg shadow-rose-200 active:scale-[0.98]"
            >
              {copy.create}
            </button>
            <button
              type="button"
              onClick={() => finish("signin")}
              className="min-h-12 rounded-2xl px-5 text-sm font-extrabold text-rose-600 active:bg-rose-50"
            >
              {copy.signIn}
            </button>
          </div>
        )}
      </footer>
    </main>
  );
}

function OnboardingPage({
  artwork,
  eyebrow,
  title,
  body,
  compact = false,
  children,
}: {
  artwork: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-1 flex-col ${compact ? "pt-3" : "pt-6"}`}>
      <div className={`flex items-center justify-center ${compact ? "min-h-44" : "min-h-56"}`}>{artwork}</div>
      <div className={compact ? "mt-2" : "mt-5"}>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-rose-500">{eyebrow}</p>
        <h1 className="m-0 text-[clamp(1.75rem,7vw,2.25rem)] font-black leading-[1.12] tracking-[-0.035em] text-slate-950">
          {title}
        </h1>
        <p className="mt-3 text-[15px] font-medium leading-6 text-slate-500">{body}</p>
        {children}
      </div>
    </div>
  );
}

function WelcomeArtwork() {
  return (
    <div className="relative grid h-52 w-72 place-items-center" aria-hidden="true">
      <div className="absolute h-44 w-44 rounded-full bg-gradient-to-br from-rose-100 to-sky-100 shadow-inner" />
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative">
        <div className="grid h-32 w-32 place-items-center rounded-[2.5rem] bg-white shadow-2xl shadow-rose-200/70">
          <BookHeart className="h-16 w-16 text-rose-500" strokeWidth={1.7} />
        </div>
        <span className="absolute -right-5 -top-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-200">
          <Heart className="h-6 w-6 fill-white text-white" />
        </span>
      </motion.div>
    </div>
  );
}

function HabitsArtwork() {
  return (
    <div className="relative h-52 w-72" aria-hidden="true">
      <div className="absolute inset-x-8 bottom-2 top-3 rotate-[-4deg] rounded-[2rem] bg-sky-100" />
      <div className="absolute inset-x-8 bottom-2 top-3 rotate-[4deg] rounded-[2rem] bg-rose-100" />
      <div className="absolute inset-x-8 bottom-2 top-3 grid place-items-center rounded-[2rem] border border-white bg-white shadow-xl">
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-50">
            <Sparkles className="h-10 w-10 text-rose-500" />
          </span>
          <div className="mx-auto mt-5 h-2.5 w-28 rounded-full bg-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 0.7, delay: 0.15 }} className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectArtwork() {
  return (
    <div className="relative flex h-52 w-72 items-center justify-center" aria-hidden="true">
      <motion.div initial={{ x: -30 }} animate={{ x: 5 }} transition={{ duration: 0.55 }} className="z-10 grid h-28 w-28 place-items-center rounded-full border-[6px] border-white bg-sky-100 shadow-xl">
        <Users className="h-12 w-12 text-sky-600" />
      </motion.div>
      <motion.div initial={{ x: 30 }} animate={{ x: -5 }} transition={{ duration: 0.55 }} className="z-20 grid h-28 w-28 place-items-center rounded-full border-[6px] border-white bg-rose-100 shadow-xl">
        <Heart className="h-12 w-12 fill-rose-500 text-rose-500" />
      </motion.div>
      <span className="absolute bottom-3 z-30 rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black tracking-[0.18em] text-rose-500 shadow-lg">CONNECTED</span>
    </div>
  );
}

function PrivacyArtwork() {
  return (
    <div className="relative grid h-40 w-64 place-items-center" aria-hidden="true">
      <div className="absolute h-36 w-36 rounded-full bg-gradient-to-br from-rose-100 to-sky-100" />
      <div className="relative grid h-28 w-28 place-items-center rounded-[2.2rem] bg-white shadow-xl shadow-slate-200/70">
        <LockKeyhole className="h-12 w-12 text-rose-500" strokeWidth={1.8} />
        <span className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-500 ring-4 ring-white">
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, label }: { icon: typeof LockKeyhole; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3.5 shadow-sm">
      <Icon className="mb-2 h-5 w-5 text-rose-500" aria-hidden="true" />
      <p className="text-xs font-extrabold leading-4 text-slate-700">{label}</p>
    </div>
  );
}
