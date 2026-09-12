import { memo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Ellipsis,
  Globe2,
  HandHeart,
  Home,
  MessageCircleHeart,
  User,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
}

export const BottomNavigation = memo(function BottomNavigation({
  activeTab,
  onTabChange,
  chatUnreadCount = 0,
}: BottomNavigationProps) {
  const { t, language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreLabel = { en: "More", am: "ተጨማሪ", om: "Dabalata" }[language];

  const tabs = [
    { id: "home", label: t.nav.home, icon: Home },
    { id: "devotions", label: t.nav.devotions, icon: BookOpen },
    { id: "prayer", label: t.nav.prayer, icon: HandHeart },
    { id: "chat", label: t.nav.chat, icon: MessageCircleHeart },
    { id: "more", label: moreLabel, icon: Ellipsis },
  ];
  const moreTabs = [
    { id: "community", label: t.nav.community, icon: Globe2 },
    { id: "profile", label: t.nav.profile, icon: User },
  ];

  return (
    <Dialog open={isMoreOpen} onOpenChange={setIsMoreOpen}>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pt-5"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <nav
          aria-label={t.nav.primaryNavigation}
          className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-white/90 bg-white/90 px-2 shadow-[0_-2px_10px_rgba(83,45,67,0.03),0_16px_45px_rgba(83,45,67,0.18)] ring-1 ring-neutral-950/[0.04] backdrop-blur-2xl"
        >
          <div className="flex min-h-[4.25rem] items-stretch justify-between gap-0.5 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isMore = tab.id === "more";
              const isActive = isMore
                ? moreTabs.some((item) => item.id === activeTab)
                : activeTab === tab.id;
              const unreadCount = tab.id === "chat" ? chatUnreadCount : 0;
              const actionLabel =
                unreadCount > 0
                  ? `${tab.label}, ${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"}`
                  : tab.label;

              const button = (
                <motion.button
                  type="button"
                  key={tab.id}
                  onClick={isMore ? undefined : () => onTabChange(tab.id)}
                  aria-label={actionLabel}
                  aria-current={isActive ? "page" : undefined}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  transition={{ duration: 0.16 }}
                  title={tab.label}
                  className={`group relative flex min-h-[52px] min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${isActive ? "bg-rose-50 text-primary" : "text-neutral-500 hover:bg-rose-50/60 hover:text-neutral-900"}`}
                >
                  <span className="relative flex h-7 w-9 shrink-0 items-center justify-center">
                    <Icon
                      aria-hidden="true"
                      className={`h-6 w-6 transition-transform duration-200 motion-reduce:transform-none motion-reduce:transition-none ${isActive ? "scale-105 text-primary" : "group-hover:scale-105"}`}
                      strokeWidth={isActive ? 2.4 : 1.9}
                    />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black leading-none text-white shadow-sm ring-2 ring-white"
                        aria-hidden="true"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`relative w-full break-words text-center text-[9px] leading-[1.15] ${isActive ? "font-extrabold text-primary" : "font-semibold"}`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
              return isMore ? (
                <DialogTrigger asChild key={tab.id}>
                  {button}
                </DialogTrigger>
              ) : (
                button
              );
            })}
          </div>
        </nav>
      </div>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-3xl border-rose-100 bg-white p-5 shadow-xl motion-reduce:animate-none motion-reduce:transition-none sm:max-w-sm"
      >
        <DialogHeader className="pr-12 text-left">
          <DialogTitle className="text-xl font-bold text-neutral-900">
            {moreLabel}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {t.nav.community} · {t.nav.profile}
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <button
            type="button"
            aria-label={t.common.close}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </DialogClose>
        <div className="grid gap-2">
          {moreTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setIsMoreOpen(false);
                  onTabChange(tab.id);
                }}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? "border-rose-200 bg-rose-50 text-primary" : "border-neutral-100 bg-white text-neutral-700 hover:border-rose-100 hover:bg-rose-50/60"}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold">
                  {tab.label}
                </span>
                <ChevronRight
                  size={18}
                  className="text-neutral-400"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
});
