import { memo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Ellipsis,
  Globe2,
  Heart,
  Home,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import "../styles/bottom-navigation.css";
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
    { id: "prayer", label: t.nav.prayer, icon: Heart },
    { id: "chat", label: t.nav.chat, icon: MessageCircle },
    { id: "more", label: moreLabel, icon: Ellipsis },
  ];
  const moreTabs = [
    { id: "community", label: t.nav.community, icon: Globe2 },
    { id: "profile", label: t.nav.profile, icon: User },
  ];

  return (
    <Dialog open={isMoreOpen} onOpenChange={setIsMoreOpen}>
      <div className="tbo-bottom-navigation fixed inset-x-0 bottom-0 z-50 border-t border-[#eceef1] bg-white">
        <nav
          aria-label={t.nav.primaryNavigation}
          className="tbo-bottom-navigation__container mx-auto w-full max-w-2xl"
        >
          <div className="tbo-bottom-navigation__tabs">
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
                  className={`tbo-bottom-navigation__action group rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-1 ${isActive ? "bg-[#fef1f4] text-[#e11d48]" : "text-[#6b7280] hover:bg-rose-50/60 hover:text-neutral-900"}`}
                >
                  <span className="tbo-bottom-navigation__icon">
                    <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
                    {unreadCount > 0 && (
                      <span
                        className="tbo-bottom-navigation__badge rounded-full bg-[#f43f5e] text-white ring-2 ring-white"
                        aria-hidden="true"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="tbo-bottom-navigation__label">
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
        className="tbo-navigation-more max-w-[calc(100%-2rem)] rounded-3xl border-rose-100 bg-white p-5 shadow-xl motion-reduce:animate-none motion-reduce:transition-none sm:max-w-sm"
      >
        <DialogHeader className="pr-12 text-left">
          <DialogTitle className="tbo-navigation-more__title font-medium text-neutral-900">
            {moreLabel}
          </DialogTitle>
          <DialogDescription className="tbo-navigation-more__description text-neutral-500">
            {t.nav.community} · {t.nav.profile}
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <button
            type="button"
            aria-label={t.common.close}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={24} aria-hidden="true" />
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
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="tbo-navigation-more__item-label flex-1">
                  {tab.label}
                </span>
                <ChevronRight
                  size={22}
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
